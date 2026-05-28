import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DATABASE_PATH ?? 'wallet.sqlite',
      autoLoadEntities: true,
      synchronize: true,
    }),
  ],
})
export class AppModule {}
