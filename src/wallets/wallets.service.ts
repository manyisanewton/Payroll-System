import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import { ApiException } from "../common/errors/api-exception";
import { ErrorCode } from "../common/errors/error-code";
import {
  WalletTransaction,
  WalletTransactionType,
} from "../transfers/entities/wallet-transaction.entity";
import { DepositFundsDto } from "./dto/deposit-funds.dto";
import { Wallet } from "./entities/wallet.entity";

@Injectable()
export class WalletsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Wallet)
    private readonly walletsRepository: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly transactionsRepository: Repository<WalletTransaction>,
  ) {}

  async deposit(walletId: string, dto: DepositFundsDto) {
    return this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(Wallet, { where: { id: walletId } });

      if (!wallet) {
        throw new ApiException(
          HttpStatus.NOT_FOUND,
          ErrorCode.WALLET_NOT_FOUND,
          "Wallet not found.",
        );
      }

      await manager
        .createQueryBuilder()
        .update(Wallet)
        .set({
          balanceMinorUnits: () => "balanceMinorUnits + :amount",
        })
        .where("id = :walletId", { walletId, amount: dto.amountMinorUnits })
        .execute();

      const transaction = await manager.save(
        manager.create(WalletTransaction, {
          type: WalletTransactionType.Deposit,
          amountMinorUnits: dto.amountMinorUnits,
          currency: wallet.currency,
          sourceWalletId: null,
          destinationWalletId: wallet.id,
          description: dto.description ?? null,
        }),
      );
      const updatedWallet = await manager.findOneByOrFail(Wallet, {
        id: walletId,
      });

      return { wallet: updatedWallet, transaction };
    });
  }

  async listTransactions(walletId: string, query: PaginationQueryDto) {
    const walletExists = await this.walletsRepository.exists({
      where: { id: walletId },
    });

    if (!walletExists) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ErrorCode.WALLET_NOT_FOUND,
        "Wallet not found.",
      );
    }

    const page = query.page;
    const limit = query.limit;
    const [items, total] = await this.transactionsRepository
      .createQueryBuilder("transaction")
      .where("transaction.sourceWalletId = :walletId", { walletId })
      .orWhere("transaction.destinationWalletId = :walletId", { walletId })
      .orderBy("transaction.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
