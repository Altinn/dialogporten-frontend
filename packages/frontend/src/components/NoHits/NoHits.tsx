import { Heading, Section, Typography } from '@altinn/altinn-components';

interface EmptyStateProps {
  queryString?: string;
  description?: string;
}

export const NoHits = ({ title, description }: EmptyStateProps) => {
  return (
    <Section spacing={3} margin="section">
      <Heading size="lg">{title}</Heading>
      {description && (
        <Typography size="sm">
          <p>{description}</p>
        </Typography>
      )}
    </Section>
  );
};
