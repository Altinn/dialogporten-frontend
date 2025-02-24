import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
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
