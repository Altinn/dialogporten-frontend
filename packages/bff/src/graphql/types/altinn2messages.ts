import { objectType } from 'nexus';

type Altinn2MessageType = 'FormTask' | 'MessageTask' | 'PaymentTask' | 'ArchiveTask' | 'SubmissionTask';

export interface Altinn2MessageData {
  MessageId: string;
  Subject: string;
  Status: string;
  LastChangedDateTime: string;
  CreatedDate: string;
  LastChangedBy: string;
  ServiceOwner: string;
  Type: Altinn2MessageType;
  ServiceCode: string;
  ServiceEdition: number;
  ArchiveReference?: string;
  _links: {
    self: {
      href: string;
    };
    print?: {
      href: string;
      'mime-type'?: string;
    };
    portalview?: {
      href: string;
    };
    metadata?: {
      href: string;
    };
  };
}

export interface Altinn2MessagesResponse {
  _links: {
    find: {
      href: string;
      isTemplated: boolean;
    };
    portalview: {
      href: string;
    };
    self: {
      href: string;
    };
  };
  _embedded: {
    messages: Altinn2MessageData[];
  };
}

export const Altinn2MessageLink = objectType({
  name: 'Altinn2MessageLink',
  definition(t) {
    t.nonNull.string('href', { resolve: (link) => link.href });
    t.string('mimeType', {
      resolve: (link) => link['mime-type'],
      description: 'MIME type for the link (e.g., application/pdf for print links)',
    });
  },
});

export const Altinn2MessageLinks = objectType({
  name: 'Altinn2MessageLinks',
  definition(t) {
    t.nonNull.field('self', {
      type: 'Altinn2MessageLink',
      resolve: (links) => links.self,
    });
    t.field('print', {
      type: 'Altinn2MessageLink',
      resolve: (links) => links.print,
    });
    t.field('portalview', {
      type: 'Altinn2MessageLink',
      resolve: (links) => links.portalview,
    });
    t.field('metadata', {
      type: 'Altinn2MessageLink',
      resolve: (links) => links.metadata,
    });
  },
});

export const Altinn2Message = objectType({
  name: 'Altinn2Message',
  definition(t) {
    t.nonNull.string('MessageId', {
      description: 'Unique identifier for the message',
      resolve: (message) => message.MessageId,
    });
    t.nonNull.string('MessageLink', {
      description: 'URL link to the message (derived from _links.self.href)',
      resolve: (message) => message._links?.self?.href || '',
    });
    t.nonNull.string('Subject', {
      description: 'Subject/title of the message',
      resolve: (message) => message.Subject,
    });
    t.nonNull.string('Status', {
      description: 'Current status of the message',
      resolve: (message) => message.Status,
    });
    t.nonNull.string('LastChangedDateTime', {
      description: 'ISO datetime when the message was last changed',
      resolve: (message) => message.LastChangedDateTime,
    });
    t.nonNull.string('CreatedDate', {
      description: 'ISO datetime when the message was created',
      resolve: (message) => message.CreatedDate,
    });
    t.nonNull.string('LastChangedBy', {
      description: 'Name of the user who last changed the message',
      resolve: (message) => message.LastChangedBy,
    });
    t.nonNull.string('ServiceOwner', {
      description: 'Name of the service owner',
      resolve: (message) => message.ServiceOwner,
    });
    t.nonNull.string('Type', {
      description:
        'Type of message. Possible values: FormTask (Skjema), MessageTask, PaymentTask, ArchiveTask, SubmissionTask',
      resolve: (message) => message.Type,
    });
    t.nonNull.string('ServiceCode', {
      description: 'Service code identifier',
      resolve: (message) => message.ServiceCode,
    });
    t.nonNull.int('ServiceEdition', {
      description: 'Service edition number',
      resolve: (message) => message.ServiceEdition,
    });
    t.string('ArchiveReference', {
      description: 'Archive reference for the message',
      resolve: (message) => message.ArchiveReference,
    });
    t.field('_links', {
      type: 'Altinn2MessageLinks',
      description: 'HAL links for the message',
      resolve: (message) => message._links,
    });
  },
});
