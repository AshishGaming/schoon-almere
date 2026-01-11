import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Middleware
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-User-Token"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
  credentials: false,
}));
app.use("*", logger(console.log));

// Supabase client
const getSupabaseClient = (accessToken?: string) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!; // Always use ANON_KEY, not the access token!
  
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
  });
};

const getServiceRoleClient = () => {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
};

const getAnonClient = () => {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );
};

// ========================================
// AUTH ROUTES
// ========================================

// Sign up
app.post("/make-server-2f5e78e8/auth/signup", async (c) => {
  try {
    const { email, password, name, role = "user" } = await c.req.json();

    const supabase = getServiceRoleClient();
    
    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.error("Error creating user during signup:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ 
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata.name,
        role: data.user.user_metadata.role,
      }
    });
  } catch (error) {
    console.error("Server error during signup:", error);
    return c.json({ error: "Server error during signup" }, 500);
  }
});

// Sign in
app.post("/make-server-2f5e78e8/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();

    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Error signing in user:", error);
      return c.json({ error: error.message }, 401);
    }

    return c.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata.name,
        role: data.user.user_metadata.role,
      },
      session: data.session,
    });
  } catch (error) {
    console.error("Server error during signin:", error);
    return c.json({ error: "Server error during signin" }, 500);
  }
});

// Get current user
app.get("/make-server-2f5e78e8/auth/me", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    
    if (!accessToken) {
      return c.json({ error: "No token provided" }, 401);
    }

    const supabase = getServiceRoleClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      console.error("Error getting user:", error);
      return c.json({ error: "Unauthorized - Invalid JWT" }, 401);
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata.name,
        role: user.user_metadata.role,
        avatar: user.user_metadata.avatar,
        neighborhood: user.user_metadata.neighborhood,
      },
    });
  } catch (error) {
    console.error("Server error getting user:", error);
    return c.json({ error: "Server error" }, 500);
  }
});

// Update user profile
app.patch("/make-server-2f5e78e8/users/profile", async (c) => {
  try {
    const accessToken = c.req.header("X-User-Token");
    
    if (!accessToken) {
      return c.json({ error: "No token provided" }, 401);
    }

    const supabase = getServiceRoleClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      console.error("Error authenticating user for profile update:", authError);
      return c.json({ error: "Unauthorized - Invalid JWT" }, 401);
    }

    const { avatar, neighborhood, name } = await c.req.json();

    const updatedMetadata = {
      ...user.user_metadata,
      ...(name !== undefined && { name }),
      ...(avatar !== undefined && { avatar }),
      ...(neighborhood !== undefined && { neighborhood }),
    };

    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      { user_metadata: updatedMetadata }
    );

    if (error) {
      console.error("Error updating user profile:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata.name,
        role: data.user.user_metadata.role,
        avatar: data.user.user_metadata.avatar,
        neighborhood: data.user.user_metadata.neighborhood,
      },
    });
  } catch (error) {
    console.error("Server error updating profile:", error);
    return c.json({ error: "Server error updating profile" }, 500);
  }
});

// ========================================
// REPORTS ROUTES
// ========================================

// Get all reports
app.get("/make-server-2f5e78e8/reports", async (c) => {
  try {
    const reports = await kv.getByPrefix("report:");
    
    const sortedReports = reports.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    return c.json({ reports: sortedReports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return c.json({ error: "Error fetching reports", details: error.message }, 500);
  }
});

// Create new report
app.post("/make-server-2f5e78e8/reports", async (c) => {
  try {
    const body = await c.req.json();
    
    const userId = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const userName = "Anonieme Gebruiker";

    const reportId = `report:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const report = {
      id: reportId,
      ...body,
      userId,
      userName,
      status: "gemeld",
      createdAt: new Date().toISOString(),
    };

    await kv.set(reportId, report);
    
    return c.json({ report });
  } catch (error) {
    console.error("Error creating report:", error);
    return c.json({ error: "Error creating report", details: error.message }, 500);
  }
});

// Update report status
app.patch("/make-server-2f5e78e8/reports/:id/status", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, userEmail, userName, userRole, status } = body;
    
    if (!userId || !userRole) {
      return c.json({ error: "Unauthorized - no user info" }, 401);
    }
    
    if (userRole !== "werknemer" && userRole !== "admin") {
      return c.json({ error: "Forbidden - insufficient permissions" }, 403);
    }

    const reportId = c.req.param("id");
    const report = await kv.get(reportId);
    
    if (!report) {
      return c.json({ error: "Report not found" }, 404);
    }

    const updatedReport = {
      ...report,
      status,
      updatedAt: new Date().toISOString(),
      updatedBy: userName || userEmail,
    };

    await kv.set(reportId, updatedReport);

    return c.json({ report: updatedReport });
  } catch (error) {
    console.error("Error updating report status:", error);
    return c.json({ error: "Error updating report status", details: error.message }, 500);
  }
});

// Delete report (admin only)
app.delete("/make-server-2f5e78e8/reports/:id", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    
    if (!accessToken) {
      return c.json({ error: "Unauthorized - no token" }, 401);
    }

    // Verify user is admin
    const supabase = getServiceRoleClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      console.error("Authorization error while deleting report:", authError);
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userRole = user.user_metadata.role;
    if (userRole !== "admin") {
      return c.json({ error: "Forbidden - admin only" }, 403);
    }

    const reportId = c.req.param("id");
    await kv.del(`report:${reportId}`);

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting report:", error);
    return c.json({ error: "Error deleting report" }, 500);
  }
});

// Load sample data
app.post("/make-server-2f5e78e8/reports/load-sample-data", async (c) => {
  try {
    const accessToken = c.req.header("X-User-Token");
    
    if (!accessToken) {
      return c.json({ error: "Unauthorized - no token" }, 401);
    }

    const body = await c.req.json();
    const { sampleReports } = body;
    
    if (!sampleReports || sampleReports.length === 0) {
      return c.json({ error: "No sample reports provided" }, 400);
    }

    // Accept local demo tokens for sample data
    if (accessToken.startsWith("local-token-")) {
      const promises = sampleReports.map((report: any) => kv.set(report.id, report));
      await Promise.all(promises);
      return c.json({ success: true, count: sampleReports.length });
    }

    // Verify real user is admin
    const supabase = getServiceRoleClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      // Accept anyway for development purposes
      const promises = sampleReports.map((report: any) => kv.set(report.id, report));
      await Promise.all(promises);
      return c.json({ success: true, count: sampleReports.length });
    }

    const userRole = user.user_metadata.role;
    if (userRole !== "admin") {
      return c.json({ error: "Forbidden - admin only" }, 403);
    }
    
    const promises = sampleReports.map((report: any) => kv.set(report.id, report));
    await Promise.all(promises);

    return c.json({ success: true, count: sampleReports.length });
  } catch (error) {
    console.error("Error loading sample data:", error);
    return c.json({ error: "Error loading sample data", details: error.message }, 500);
  }
});

// Health check
app.get("/make-server-2f5e78e8/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Initialize demo users on startup
async function initializeDemoUsers() {
  try {
    console.log("Starting demo user initialization...");
    const supabase = getServiceRoleClient();
    
    const demoUsers = [
      { email: "admin@grofvuil.nl", password: "admin123", name: "Admin Gebruiker", role: "admin" },
      { email: "werknemer@grofvuil.nl", password: "werk123", name: "Werknemer Jan", role: "werknemer" },
      { email: "user@example.nl", password: "user123", name: "Normale Gebruiker", role: "user" },
    ];

    for (const userData of demoUsers) {
      try {
        // Check if user already exists
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const userExists = existingUsers?.users?.some(u => u.email === userData.email);
        
        if (userExists) {
          console.log(`Demo user ${userData.email} already exists, skipping...`);
          continue;
        }

        // Try to create user
        const { data, error } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          user_metadata: { name: userData.name, role: userData.role },
          email_confirm: true,
        });

        if (error) {
          console.error(`Error creating demo user ${userData.email}:`, error);
        } else {
          console.log(`✓ Created demo user: ${userData.email} (${userData.role})`);
        }
      } catch (innerError) {
        console.error(`Exception creating demo user ${userData.email}:`, innerError);
      }
    }
    
    console.log("Demo user initialization complete!");
  } catch (error) {
    console.error("Error in initializeDemoUsers:", error);
  }
}

// Initialize on startup
setTimeout(() => {
  initializeDemoUsers();
}, 1000);

Deno.serve(app.fetch);