import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column()
  source: 'manual' | 'external';

  @Column({ nullable: true, type: 'text' })
  summary: string | null;

  @Column({ nullable: true, type: 'text' })
  nextAction: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
