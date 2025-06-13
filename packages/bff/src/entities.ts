import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'profile' })
export class ProfileTable {
  @PrimaryColumn()
  pid: string;

  @Column({ length: 255, nullable: true })
  language: string;

  @OneToMany(
    () => SavedSearch,
    (savedSearch) => savedSearch.profile,
  )
  savedSearches: SavedSearch[];

  @OneToMany(
    () => Group,
    (group) => group.profile,
    { cascade: false },
  )
  groups: Group[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

@Entity({ name: 'group' })
export class Group {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: false })
  isfavorite: boolean;

  @ManyToOne(
    () => ProfileTable,
    (profile) => profile.groups,
    { onDelete: 'NO ACTION' },
  )
  @JoinColumn({ name: 'profilePid', referencedColumnName: 'pid' })
  profile: ProfileTable;

  @ManyToMany('Party', (party: Party) => party.groups)
  @JoinTable()
  parties: Party[];
}

@Entity({ name: 'party' })
export class Party {
  @PrimaryColumn()
  id: string;

  @ManyToMany('Group', (group: Group) => group.parties)
  groups: Group[];
}

export interface Filter {
  id: string;
  value: string;
}
export interface SavedSearchData {
  filters?: Filter[];
  searchString?: string;
  fromView?: string;
}

@Entity({ name: 'saved_search' })
export class SavedSearch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'json' })
  data: SavedSearchData;

  @Column({ length: 255, nullable: true })
  name: string;

  @ManyToOne(
    () => ProfileTable,
    (profile) => profile.savedSearches,
  )
  profile: ProfileTable;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
