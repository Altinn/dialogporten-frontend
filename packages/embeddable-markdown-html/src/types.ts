import type { FormSubmitHandler } from './formComponents.tsx';
import type { FormPolicy } from './formPolicy.ts';

export interface EmbeddableContentProps {
  children: string;
  onError: (error: ErrorEvent) => void;
  onSubmit?: FormSubmitHandler;
  formPolicy?: FormPolicy;
}
