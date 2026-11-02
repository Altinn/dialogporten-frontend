import { Button, DsDetails } from '@altinn/altinn-components';
import { PlusIcon, TrashIcon } from '@navikt/aksel-icons';
import { type ReactNode, useRef, useState } from 'react';
import styles from './dialogBuilder.module.css';

interface RepeatableItemsProps<T> {
  itemLabel: string;
  path: string;
  items: T[];
  createItem: () => T;
  getTitle: (item: T) => string | undefined;
  onChange: (items: T[]) => void;
  children: (item: T, update: (patch: Partial<T>) => void, itemPath: string) => ReactNode;
}

export const RepeatableItems = <T,>({
  itemLabel,
  path,
  items,
  createItem,
  getTitle,
  onChange,
  children,
}: RepeatableItemsProps<T>) => {
  const keys = useRef<number[]>([]);
  const nextKey = useRef(0);
  const [addedKey, setAddedKey] = useState<number>();

  while (keys.current.length < items.length) {
    keys.current.push(nextKey.current++);
  }
  keys.current.length = items.length;

  const addItem = () => {
    setAddedKey(nextKey.current);
    onChange([...items, createItem()]);
  };

  const removeItem = (index: number) => {
    keys.current.splice(index, 1);
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <>
      <div>
        {items.map((item, index) => {
          const key = keys.current[index];
          const label = `${itemLabel} ${index + 1}`;
          const title = getTitle(item);

          return (
            <DsDetails key={key} defaultOpen={key === addedKey}>
              <DsDetails.Summary>{title ? `${label}: ${title}` : label}</DsDetails.Summary>
              <DsDetails.Content>
                <div className={styles.itemContent}>
                  {children(
                    item,
                    (patch) => onChange(items.map((current, i) => (i === index ? { ...current, ...patch } : current))),
                    `${path}.${index}`,
                  )}
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Fjern ${label.toLowerCase()}`}
                      onClick={() => removeItem(index)}
                    >
                      <TrashIcon aria-hidden />
                      Fjern
                    </Button>
                  </div>
                </div>
              </DsDetails.Content>
            </DsDetails>
          );
        })}
      </div>
      <div>
        <Button variant="outline" size="sm" onClick={addItem}>
          <PlusIcon aria-hidden />
          {`Legg til ${itemLabel.toLowerCase()}`}
        </Button>
      </div>
    </>
  );
};
