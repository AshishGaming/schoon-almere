import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Trash2, Map, Camera, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';

interface WelcomeScreenProps {
  onComplete: () => void;
}

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: Trash2,
      title: 'Welkom bij Schoon',
      description: 'De eenvoudige manier om grofvuil in jouw buurt te melden',
      color: 'text-green-600',
    },
    {
      icon: Map,
      title: 'Bekijk de kaart',
      description: 'Zie alle meldingen in jouw omgeving op de interactieve kaart',
      color: 'text-blue-600',
    },
    {
      icon: Camera,
      title: 'Maak een foto',
      description: 'Neem een foto van het grofvuil en upload deze eenvoudig',
      color: 'text-purple-600',
    },
    {
      icon: MapPin,
      title: 'Automatische locatiebepaling',
      description: 'Je GPS-locatie wordt automatisch bepaald voor nauwkeurige meldingen',
      color: 'text-orange-600',
    },
    {
      icon: CheckCircle2,
      title: 'Klaar om te beginnen!',
      description: 'Meld grofvuil en help jouw buurt schoon te houden',
      color: 'text-green-600',
    },
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      localStorage.setItem('welcomeCompleted', 'true');
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('welcomeCompleted', 'true');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl">
        <CardContent className="p-8">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'w-8 bg-green-600'
                    : index < currentStep
                    ? 'w-2 bg-green-400'
                    : 'w-2 bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-6">
              <Icon className={`h-16 w-16 ${currentStepData.color}`} />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              {currentStepData.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {currentStepData.description}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleNext}
              className="w-full gap-2 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {isLastStep ? 'Aan de slag' : 'Volgende'}
              <ArrowRight className="h-4 w-4" />
            </Button>

            {!isLastStep && (
              <Button
                onClick={handleSkip}
                variant="ghost"
                className="w-full"
                size="lg"
              >
                Overslaan
              </Button>
            )}
          </div>

          {/* Step counter */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Stap {currentStep + 1} van {steps.length}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}