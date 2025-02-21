import type { ReactElement } from 'react';
import styles from './inboxItems.module.css';

interface InboxItemsProps {
  children: React.ReactNode;
}

/**
 * A container component for displaying a list of inbox items. It serves as a wrapper
 * for individual `InboxItem` components, ensuring they are styled and organized collectively.
 * This component primarily handles the layout of its children inbox items.
 *
 * @component
 * @param {Object} props - The properties passed to the component.
 * @param {React.ReactNode} props.children - The child components to be rendered within the container.
 * Typically, these are `InboxItem` components, but can include any React nodes.
 * @returns {ReactElement} A div element wrapping the children in a styled manner,
 * according to the `inboxItems` CSS class defined in `inboxItems.module.css`.
 *
 */

export const InboxItems = ({ children }: InboxItemsProps): ReactElement => {
  return <ul className={styles.inboxItems}>{children}</ul>;
};
