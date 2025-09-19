import { ActorType } from 'bff-types-generated';

export const getActorType = (actor: { actorType?: ActorType | null; actorId?: string | null }):
  | 'company'
  | 'person' => {
  const isServiceOwner = actor.actorType === ActorType.ServiceOwner;
  const isCompany = isServiceOwner || (actor.actorId ?? '').includes('urn:altinn:organization:');
  return isCompany ? 'company' : 'person';
};

export const toTitleCase = (str: string | undefined | null, type: 'person' | 'company' = 'person') => {
  if (!str) return '';

  return str
    .toLowerCase()
    .split(' ')
    .map((word) => {
      if (word === 'as') {
        return type === 'company' ? 'AS' : 'As';
      }

      return word
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('-');
    })
    .join(' ');
};
