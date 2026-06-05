import BrowserOnly from '@docusaurus/BrowserOnly';
import type { WrapperProps } from '@docusaurus/types';
import MermaidOriginal from '@theme-original/Mermaid';
import type MermaidType from '@theme/Mermaid';
import type { ReactElement } from 'react';

type Props = WrapperProps<typeof MermaidType>;

export default function Mermaid(props: Props): ReactElement {
  return <BrowserOnly>{() => <MermaidOriginal {...props} />}</BrowserOnly>;
}
