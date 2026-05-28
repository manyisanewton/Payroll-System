import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { Customer } from "../src/customers/entities/customer.entity";
import {
  WalletTransaction,
  WalletTransactionType,
} from "../src/transfers/entities/wallet-transaction.entity";
import { Wallet } from "../src/wallets/entities/wallet.entity";
import { WalletsModule } from "../src/wallets/wallets.module";
import { WalletsService } from "../src/wallets/wallets.service";

describe("WalletsService", () => {
  let moduleRef: TestingModule;
  let dataSource: DataSource;
  let walletsService: WalletsService;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "sqlite",
          database: ":memory:",
          entities: [Customer, Wallet, WalletTransaction],
          synchronize: true,
          dropSchema: true,
        }),
        WalletsModule,
      ],
    }).compile();

    dataSource = moduleRef.get(DataSource);
    walletsService = moduleRef.get(WalletsService);
  });

  afterEach(async () => {
    await dataSource.destroy();
    await moduleRef.close();
  });

  it("returns wallet transactions with table-ready rows", async () => {
    const wallet = await createWallet();
    await dataSource.getRepository(WalletTransaction).save([
      {
        type: WalletTransactionType.Deposit,
        amountMinorUnits: 5000,
        currency: "USD",
        sourceWalletId: null,
        destinationWalletId: wallet.id,
        description: "Initial deposit",
      },
      {
        type: WalletTransactionType.Transfer,
        amountMinorUnits: 1250,
        currency: "USD",
        sourceWalletId: wallet.id,
        destinationWalletId: "ad649653-2c34-4efc-9740-6a3c772c2e25",
        description: "Test transfer",
      },
    ]);

    const result = await walletsService.listTransactions(wallet.id, {
      page: 1,
      limit: 20,
    });

    expect(result.rows).toEqual([
      expect.objectContaining({
        type: WalletTransactionType.Transfer,
        amount: 1250,
        currency: "USD",
        description: "Test transfer",
      }),
      expect.objectContaining({
        type: WalletTransactionType.Deposit,
        amount: 5000,
        currency: "USD",
        description: "Initial deposit",
      }),
    ]);
    expect(result.meta).toEqual({
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
    });
  });

  async function createWallet(): Promise<Wallet> {
    const customer = await dataSource.getRepository(Customer).save({
      name: "Ada Lovelace",
      email: "ada@example.com",
    });

    return dataSource.getRepository(Wallet).save({
      customerId: customer.id,
      balanceMinorUnits: 5000,
      currency: "USD",
    });
  }
});
