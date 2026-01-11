import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlightPadding?: number;
}

interface AppTourProps {
  onComplete: () => void;
}

export function AppTour({ onComplete }: AppTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [elementRect, setElementRect] = useState<DOMRect | null>(null);

  const steps: TourStep[] = [
    {
      target: 'welcome',
      title: 'Welkom bij de app!',
      description: 'We nemen je mee in een korte rondleiding. Dit duurt ongeveer 1 minuut.',
      position: 'center',
    },
    {
      target: '[data-tour="report-button"]',
      title: 'Nieuwe melding maken',
      description: 'Klik op deze grote groene knop om grofvuil te melden. Je kunt een foto maken, een beschrijving toevoegen en de locatie wordt automatisch bepaald.',
      position: 'top',
      highlightPadding: 12,
    },
    {
      target: '[data-tour="view-toggle"]',
      title: 'Wissel van weergave',
      description: 'Hier kun je schakelen tussen de kaartweergave en een lijstoverzicht van alle meldingen.',
      position: 'bottom',
      highlightPadding: 10,
    },
    {
      target: '[data-tour="theme-toggle"]',
      title: 'Licht/Donker modus',
      description: 'Met deze knop kun je schakelen tussen lichte en donkere weergave, wat prettiger kan zijn voor je ogen.',
      position: 'bottom',
      highlightPadding: 10,
    },
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Update element position when step changes or window resizes
  useEffect(() => {
    const updateElementPosition = () => {
      if (currentStepData.target === 'welcome') {
        setElementRect(null);
        return;
      }

      // Try to find the element - for view-toggle, try both desktop and mobile versions
      let element: Element | null = null;
      
      if (currentStepData.target === '[data-tour="view-toggle"]') {
        // Try desktop version first
        element = document.querySelector('[data-tour="view-toggle"]');
        // If not visible (hidden on mobile), try mobile version
        if (element && window.getComputedStyle(element).display === 'none') {
          element = document.querySelector('[data-tour="view-toggle-mobile"]');
        }
      } else {
        element = document.querySelector(currentStepData.target);
      }
      
      if (element) {
        const rect = element.getBoundingClientRect();
        setElementRect(rect);
      } else {
        console.warn(`Element not found: ${currentStepData.target}`);
        setElementRect(null);
      }
    };

    // Initial update
    updateElementPosition();

    // Update on resize and scroll
    window.addEventListener('resize', updateElementPosition);
    window.addEventListener('scroll', updateElementPosition, true);

    return () => {
      window.removeEventListener('resize', updateElementPosition);
      window.removeEventListener('scroll', updateElementPosition, true);
    };
  }, [currentStep, currentStepData.target]);

  const handleNext = () => {
    if (isLastStep) {
      localStorage.setItem('tourCompleted', 'true');
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('tourCompleted', 'true');
    onComplete();
  };

  // Calculate tooltip position
  const getTooltipStyle = () => {
    if (!elementRect || currentStepData.position === 'center') {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '90vw',
        width: '500px',
      };
    }

    const padding = 20;
    const tooltipMaxWidth = 500;
    const tooltipEstimatedHeight = 300;
    
    let style: any = { 
      position: 'fixed' as const,
      maxWidth: '90vw',
      width: `${tooltipMaxWidth}px`,
    };

    const centerX = elementRect.left + elementRect.width / 2;
    const centerY = elementRect.top + elementRect.height / 2;

    switch (currentStepData.position) {
      case 'bottom':
        // Position below element
        if (elementRect.bottom + padding + tooltipEstimatedHeight > window.innerHeight) {
          // Not enough space below, position above instead
          style.bottom = `${window.innerHeight - elementRect.top + padding}px`;
        } else {
          style.top = `${elementRect.bottom + padding}px`;
        }
        style.left = `${Math.max(padding, Math.min(centerX - tooltipMaxWidth / 2, window.innerWidth - tooltipMaxWidth - padding))}px`;
        break;
        
      case 'top':
        // Position above element
        if (elementRect.top - padding - tooltipEstimatedHeight < 0) {
          // Not enough space above, position below instead
          style.top = `${elementRect.bottom + padding}px`;
        } else {
          style.bottom = `${window.innerHeight - elementRect.top + padding}px`;
        }
        style.left = `${Math.max(padding, Math.min(centerX - tooltipMaxWidth / 2, window.innerWidth - tooltipMaxWidth - padding))}px`;
        break;
        
      case 'left':
        style.right = `${window.innerWidth - elementRect.left + padding}px`;
        style.top = `${Math.max(padding, centerY - tooltipEstimatedHeight / 2)}px`;
        break;
        
      case 'right':
        style.left = `${elementRect.right + padding}px`;
        style.top = `${Math.max(padding, centerY - tooltipEstimatedHeight / 2)}px`;
        break;
    }

    return style;
  };

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* SVG overlay with cutout */}
      {elementRect ? (
        <svg className="absolute inset-0 w-full h-full pointer-events-auto">
          <defs>
            <mask id="spotlight-mask">
              {/* White background */}
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {/* Black cutout for the highlighted element */}
              <rect
                x={elementRect.left - (currentStepData.highlightPadding || 10)}
                y={elementRect.top - (currentStepData.highlightPadding || 10)}
                width={elementRect.width + (currentStepData.highlightPadding || 10) * 2}
                height={elementRect.height + (currentStepData.highlightPadding || 10) * 2}
                rx="12"
                fill="black"
              />
            </mask>
          </defs>
          {/* Dark overlay with cutout */}
          <rect 
            x="0" 
            y="0" 
            width="100%" 
            height="100%" 
            fill="rgba(0, 0, 0, 0.7)" 
            mask="url(#spotlight-mask)"
            className="transition-opacity duration-300"
          />
        </svg>
      ) : (
        <div className="absolute inset-0 bg-black/70 transition-opacity duration-300 pointer-events-auto" />
      )}
      
      {/* Glowing animated border around highlighted element */}
      {elementRect && (
        <div
          className="absolute pointer-events-none animate-pulse transition-all duration-300 ease-out"
          style={{
            left: `${elementRect.left - (currentStepData.highlightPadding || 10)}px`,
            top: `${elementRect.top - (currentStepData.highlightPadding || 10)}px`,
            width: `${elementRect.width + (currentStepData.highlightPadding || 10) * 2}px`,
            height: `${elementRect.height + (currentStepData.highlightPadding || 10) * 2}px`,
            borderRadius: '12px',
            boxShadow: '0 0 0 4px rgba(34, 197, 94, 0.8), 0 0 25px 8px rgba(34, 197, 94, 0.5), 0 0 50px 15px rgba(34, 197, 94, 0.3)',
            zIndex: 10001,
          }}
        />
      )}

      {/* Tour card */}
      <div style={getTooltipStyle()} className="z-[10002] pointer-events-auto">
        <Card className="shadow-2xl border-2 border-green-500 animate-in fade-in zoom-in duration-300">
          <CardContent className="p-6 relative">
            {/* Close button */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
              aria-label="Rondleiding sluiten"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Progress */}
            <div className="mb-6 pr-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Stap {currentStep + 1} van {steps.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
                <div
                  className="bg-green-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                {currentStepData.title}
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                {currentStepData.description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {!isFirstStep && (
                <Button
                  onClick={handleBack}
                  variant="outline"
                  size="lg"
                  className="gap-2 text-base"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Vorige
                </Button>
              )}

              <Button
                onClick={handleNext}
                className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-base"
                size="lg"
              >
                {isLastStep ? 'Afronden' : 'Volgende'}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Skip button */}
            {!isLastStep && (
              <button
                onClick={handleSkip}
                className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
              >
                Rondleiding overslaan
              </button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}