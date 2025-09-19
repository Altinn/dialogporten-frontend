import { AvatarGroup, type AvatarProps, Badge } from '@altinn/altinn-components';
import { useState } from 'react';
import styles from './UserNotificationSettingsModal.module.css';

interface NotificationUsedByListProps {
  currentEnduserName: string;
  avatarItems: AvatarProps[];
}

export const NotificationUsedByList = ({ currentEnduserName, avatarItems }: NotificationUsedByListProps) => {
  const [expandAvatarGroup, setExpandAvatarGroup] = useState(false);
  return (
    <div>
      <button style={{ display: 'contents' }} onClick={() => setExpandAvatarGroup(!expandAvatarGroup)} type="button">
        <div className={styles.avatarGroupContainer}>
          <AvatarGroup
            defaultType="company"
            items={[{ name: currentEnduserName, type: 'person' }, ...avatarItems]}
            className={styles.avatarGroup}
          />
          <p>Brukes av deg + {avatarItems?.length} </p>
        </div>
        {expandAvatarGroup && (
          <div className={styles.avatarGroupDetailsContainer}>
            <div className={styles.avatarGroupDetailsItem}>
              <AvatarGroup
                defaultType="person"
                className={styles.avatarGroup}
                items={[{ name: currentEnduserName, type: 'person' }]}
              />
              <p className={styles.avatarGroupDetailsItemName}>{currentEnduserName}</p>
              <Badge color="person" label={'Deg'} />
            </div>
            {avatarItems.map((item, index) => (
              <div key={item.name + index} className={styles.avatarGroupDetailsItem}>
                <AvatarGroup
                  defaultType="company"
                  className={styles.avatarGroup}
                  key={item.name}
                  items={[{ name: item.name, type: 'company' }]}
                />
                <p> {item.name}</p>
              </div>
            ))}
          </div>
        )}
      </button>
    </div>
  );
};
