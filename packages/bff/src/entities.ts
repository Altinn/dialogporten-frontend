import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
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

  @OneToMany('saved_search', 'profile')
  savedSearches: SavedSearch[];

  @OneToMany(
    () => Group,
    (group) => group.profile,
    { cascade: true },
  )
  groups: Group[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

@Entity({ name: 'party' })
export class Party {
  @PrimaryColumn()
  id: number;

  @ManyToMany(
    () => Group,
    (group) => group.parties,
  )
  groups: Group[];
}

@Entity({ name: 'group' })
export class Group {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: false })
  isfavorite: boolean;

  // Relationship to Profile
  @ManyToOne(
    () => ProfileTable,
    (profile) => profile.groups,
  )
  profile: ProfileTable;

  // Relationship to Parties (maintained from original design)
  @ManyToMany(() => Party, { cascade: true })
  @JoinTable()
  parties: Party[];
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

  @ManyToOne('profile', 'saved_search')
  profile: ProfileTable;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
