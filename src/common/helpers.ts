import { 
    INT_ZERO, 
    INT_ONE,
    BIGINT_ZERO,
    BIGDECIMAL_ZERO,
    FACTORY_ADDRESS,
    DOLA_ADDRESS,
    anDOLA_ADDRESS,
    INV_ADDRESS,
    XINV_ADDRESS,
    SECONDS_PER_DAY
} from "./constants"
import { 
    CErc20, 
    Mint, 
    Redeem, 
    Borrow, 
    RepayBorrow, 
    LiquidateBorrow 
} from '../../generated/templates/CToken/CErc20'
import { 
    JumpRateModelV2
} from '../../generated/templates/CToken/JumpRateModelV2'
import { 
    Account,
    DailyActiveAccount,
    Market, 
    Deposit, 
    Withdraw, 
    Borrow as BorrowSC,
    Repay, 
    Liquidate,
    UsageMetricsDailySnapshot,
    MarketDailySnapshot,
    FinancialsDailySnapshot
} from '../../generated/schema'
import { Factory } from '../../generated/Factory/Factory'
import { log, ethereum, BigDecimal, BigInt, Address } from '@graphprotocol/graph-ts'
import { PriceOracle } from '../../generated/Factory/PriceOracle';
import { LendingProtocol } from '../../generated/schema';
import { MANTISSA_FACTOR } from './constants';
import { 
    getOrCreateProtocol,
    getOrCreateToken, 
    //getOrCreateUnderlyingToken, 
    getOrCreateFinancialsDailySnapshot,
    getOrCreateMarket,
    getUnderlyingTokenPrice
  } from "./getters"


// Create Account entity for participating account
// return 1 if account is new, 0 if account already exists
export function createAndIncrementAccount(accountId: string): i32 {
    // id: string = address.toHexString()
    let account = Account.load(accountId)
    if (account == null) {
        account = new Account(accountId)
        account.save()
        return INT_ONE
    } 
    return INT_ZERO
}

// Create DailyActiveAccount entity for participating account
// return 1 if account is new on the day, 0 if account already exists
export function createAndIncrementDailyAccount(dailyActiveAccountId: string): i32 {
    // id: string = `{Number of days since Unix epoch}-{address}`
    let account = DailyActiveAccount.load(dailyActiveAccountId)
    if (account == null) {
        account = new DailyActiveAccount(dailyActiveAccountId)
        account.save()
        return INT_ONE
    }

    return INT_ZERO
}

export function createDeposit(event: Mint): void {
        
    let depositId = event.transaction.hash.toHexString() + "-" +
        event.transactionLogIndex.toString()
    let deposit = Deposit.load(depositId)

    if (deposit == null) {
        let underlyingTokenPrice = getUnderlyingTokenPrice(event.address)
        let TokenDecimals = getOrCreateToken(event.address.toHexString()).decimals
        deposit = new Deposit(depositId)
        
        deposit.hash = event.transaction.hash.toHexString()
        deposit.logIndex = event.transactionLogIndex.toI32()
        deposit.protocol = FACTORY_ADDRESS
        deposit.to = event.address.toHexString() //dataSource.address().toHexString()
        deposit.from = event.params.minter.toHexString()
        deposit.blockNumber = event.block.number
        deposit.timestamp = event.block.timestamp
        deposit.market = event.address.toHexString()
        deposit.asset = event.address.toHexString()
        deposit.amount = event.params.mintAmount
        deposit.amountUSD = deposit.amount
                             .toBigDecimal()
                             .times(underlyingTokenPrice)
                             .div(BigInt.fromI32(10 ^ TokenDecimals).toBigDecimal())
        deposit.save()
    } else {
        log.warning('Deposit {} already exists', [depositId])
    }

}

export function createWithdraw(event: Redeem): void {
    let withdrawId = event.transaction.hash.toHexString() + '-' +
                        event.transactionLogIndex.toString()
    let withdraw = Withdraw.load(withdrawId)

    if (withdraw == null) {
        let underlyingTokenPrice = getUnderlyingTokenPrice(event.address)
        let TokenDecimals = getOrCreateToken(event.address.toHexString()).decimals
        withdraw = new Withdraw(withdrawId)

        withdraw.hash = event.transaction.hash.toHexString()
        withdraw.logIndex = event.transactionLogIndex.toI32()
        withdraw.protocol = FACTORY_ADDRESS
        withdraw.to = event.params.redeemer.toHexString()
        withdraw.from = event.address.toHexString() //dataSource.address().toHexString()
        withdraw.blockNumber = event.block.number
        withdraw.timestamp = event.block.timestamp
        withdraw.market = event.address.toHexString()
        withdraw.asset = event.address.toHexString()
        withdraw.amount = event.params.redeemAmount
        withdraw.amountUSD = withdraw.amount
                                .toBigDecimal()
                                .times(underlyingTokenPrice)
                                .div(BigInt.fromI32(10 ^ TokenDecimals).toBigDecimal())
        withdraw.save()
    } else {
        log.warning('Withdraw {} already exists', [withdrawId])
    }
}

export function createBorrow(event: Borrow): void {
    let borrowId = event.transaction.hash.toHexString() + '-' +
                     event.transactionLogIndex.toString()
    let borrow = BorrowSC.load(borrowId)

    if (borrow == null) {
        let DOLAPrice = getUnderlyingTokenPrice(Address.fromString(anDOLA_ADDRESS))
        let tokenDecimals = getOrCreateToken(DOLA_ADDRESS).decimals
        borrow = new BorrowSC(borrowId)

        borrow.hash = event.transaction.hash.toHexString()
        borrow.logIndex = event.transactionLogIndex.toI32()
        borrow.protocol = FACTORY_ADDRESS
        borrow.to = event.params.borrower.toHexString()
        borrow.from = event.address.toHexString() //dataSource.address().toHexString()
        borrow.blockNumber = event.block.number
        borrow.timestamp = event.block.timestamp
        borrow.market = event.address.toHexString()
        borrow.asset = DOLA_ADDRESS
        borrow.amount = event.params.borrowAmount
        borrow.amountUSD = borrow.amount.toBigDecimal()
                                        .times(DOLAPrice)
                                        .div(BigInt.fromI32(10 ^ tokenDecimals).toBigDecimal())
        borrow.save()
    } else {
        log.warning('Borrow {} already exists', [borrowId])
    }
}

export function createRepay(event: RepayBorrow): void {
    let repayId = event.transaction.hash.toHexString() + '-' +
        event.transactionLogIndex.toString()
    let repay = Repay.load(repayId)

    if (repay == null) {
        let DOLAPrice = getUnderlyingTokenPrice(Address.fromString(anDOLA_ADDRESS))
        let tokenDecimals = getOrCreateToken(DOLA_ADDRESS).decimals
        repay = new Repay(repayId)

        repay.hash = event.transaction.hash.toHexString()
        repay.logIndex = event.transactionLogIndex.toI32()
        repay.protocol = FACTORY_ADDRESS
        repay.to = event.address.toHexString()
        repay.from = event.params.payer.toHexString() //dataSource.address().toHexString()
        repay.blockNumber = event.block.number
        repay.timestamp = event.block.timestamp
        repay.market = event.address.toHexString()
        repay.asset = DOLA_ADDRESS
        repay.amount = event.params.repayAmount
        repay.amountUSD = repay.amount.toBigDecimal()
                                      .times(DOLAPrice)
                                      .div(BigInt.fromI32(10 ^ tokenDecimals).toBigDecimal())
        repay.save()
    } else {
        log.warning('Repay {} already exists', [repayId])
    }
}

export function createLiquidate(event: LiquidateBorrow): void {
    let liquidateId = event.transaction.hash.toHexString() + '-' +
        event.transactionLogIndex.toString()
    let liquidate = Liquidate.load(liquidateId)

    if (liquidate == null) {
        let underlyingTokenPrice = getUnderlyingTokenPrice(event.address)
        let underlyingDecimals = getOrCreateToken(event.address.toHexString()).decimals
        let DOLAPrice = getUnderlyingTokenPrice(Address.fromString(anDOLA_ADDRESS))
        let DOLADecimals = getOrCreateToken(DOLA_ADDRESS).decimals
        liquidate = new Liquidate(liquidateId)

        liquidate.hash = event.transaction.hash.toHexString()
        liquidate.logIndex = event.transactionLogIndex.toI32()
        liquidate.protocol = FACTORY_ADDRESS
        liquidate.to = event.address.toHexString()
        liquidate.from = event.params.liquidator.toHexString() //dataSource.address().toHexString()
        liquidate.blockNumber = event.block.number
        liquidate.timestamp = event.block.timestamp
        liquidate.market = event.address.toHexString()
        liquidate.asset = event.params.cTokenCollateral.toHexString()
        liquidate.amount = event.params.seizeTokens
        liquidate.amountUSD = liquidate.amount.toBigDecimal()
                                              .times(underlyingTokenPrice)
                                              .div(BigInt.fromI32(10 ^ underlyingDecimals).toBigDecimal())
        let repayAmountUSD = event.params.repayAmount.toBigDecimal()
                                                     .times(DOLAPrice)
                                                     .div(BigInt.fromI32(10 ^ DOLADecimals).toBigDecimal())
        liquidate.profitUSD = liquidate.amountUSD!.minus(repayAmountUSD)

        liquidate.save()
    } else {
        log.warning('Liquidate {} already exists', [liquidateId])
    }
}

// Update UsageMetricsDailySnapshots entity and LendingProtocol.totalUniqueUsers
export function updateUsageMetrics(event: ethereum.Event, user: Address): void {
    // Number of days since Unix epoch
    let days: string = (event.block.timestamp.toI64() / SECONDS_PER_DAY).toString();
    let accountId: string = user.toHexString()
    let dailyActiveAccountId: string = days + '-' + accountId

    //let protocol = getOrCreateProtocol()
    // Account entity keeps user addresses
    let isUniqueUser = createAndIncrementAccount(accountId)
    let isDailyActiveUser = createAndIncrementAccount(dailyActiveAccountId)

    let usageMetrics = UsageMetricsDailySnapshot.load(days)
    if (usageMetrics == null) {
      usageMetrics = new UsageMetricsDailySnapshot(days)
      usageMetrics.protocol = FACTORY_ADDRESS
      usageMetrics.activeUsers = 0
      usageMetrics.totalUniqueUsers = 0
      usageMetrics.dailyTransactionCount = 0
    } 
    
    usageMetrics.activeUsers += isUniqueUser
    usageMetrics.totalUniqueUsers += isDailyActiveUser
    usageMetrics.dailyTransactionCount += 1;

    // Update the block number and timestamp to that of the last transaction of that day
    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;

    usageMetrics.save();

    // update LendingProtocol.totalUniqueUsers
    let protocol = getOrCreateProtocol()
    if (protocol == null) {
        log.error("LendingProtocol entity is null{}; something went wrong", [''])
    }

    protocol.totalUniqueUsers += isUniqueUser
    protocol.save() 
  }

// Update FinancialsDailySnapshots entity
export function updateFinancials(event: ethereum.Event): void {
    let days: string = (event.block.timestamp.toI64() / SECONDS_PER_DAY).toString()
  
    let financialMetrics = getOrCreateFinancialsDailySnapshot(event)

    let factoryContract = Factory.bind(Address.fromString(FACTORY_ADDRESS))
    let marketAddrs = factoryContract.getAllMarkets()
    // sum over AllMarkets
    for (let i = 0; i <= marketAddrs.length; i++) {
        let marketId = marketAddrs[i].toHexString()
        let market = Market.load(marketId)

        if (market != null) {
            // TODO: Verify correctness
            financialMetrics.protocolControlledValueUSD = BIGDECIMAL_ZERO
            financialMetrics.totalVolumeUSD = financialMetrics.totalVolumeUSD.plus(market.totalVolumeUSD)
            financialMetrics.totalDepositUSD = financialMetrics.totalDepositUSD.plus(market.totalDepositUSD)
            financialMetrics.totalBorrowUSD = financialMetrics.totalBorrowUSD.plus(market.totalBorrowUSD)
            // TODO: supply + borrow revenue
            // financialMetrics.supplySideRevenueUSD = 
            //financialMetrics.protocolSideRevenueUSD = 
            // financialMetrics.totalRevenueUSD = 
        }
    }
    // Update the block number and timestamp to that of the last transaction of that day
    financialMetrics.blockNumber = event.block.number
    financialMetrics.timestamp = event.block.timestamp

    financialMetrics.save()
}

export function updateFinancialsRevenue(event: ethereum.Event,
                                        newRewardUSD: BigDecimal
                                        ): void {
    let financialMetrics = getOrCreateFinancialsDailySnapshot(event)
    financialMetrics.supplySideRevenueUSD = financialMetrics.supplySideRevenueUSD.plus(newRewardUSD)
    financialMetrics.save()

}

// Update MarketDailySnapshot entity
export function updateMarketMetrics(event: ethereum.Event): void {
    let days: string = (event.block.timestamp.toI64() / SECONDS_PER_DAY).toString();
    let marketId = event.address.toHexString()

    let market = getOrCreateMarket(marketId, event)
    let marketMetrics = MarketDailySnapshot.load(days)
    if (marketMetrics == null) {
            marketMetrics = new MarketDailySnapshot(days)
            marketMetrics.protocol = FACTORY_ADDRESS
            marketMetrics.market = marketId
    }
    // use market entity to update MarketMetrics
    marketMetrics.totalValueLockedUSD = market.totalValueLockedUSD
    marketMetrics.totalVolumeUSD = market.totalVolumeUSD
    marketMetrics.totalDepositUSD = market.totalDepositUSD
    marketMetrics.totalBorrowUSD = market.totalBorrowUSD
    marketMetrics.inputTokenBalances = market.inputTokenBalances
    marketMetrics.inputTokenPricesUSD = market.inputTokenPricesUSD
    marketMetrics.outputTokenSupply = market.outputTokenSupply
    marketMetrics.outputTokenPriceUSD = market.outputTokenPriceUSD
    marketMetrics.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount
    marketMetrics.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD
    marketMetrics.depositRate = market.depositRate
    marketMetrics.stableBorrowRate = market.stableBorrowRate
    marketMetrics.variableBorrowRate = market.variableBorrowRate

    // Update the block number and timestamp to that of the last transaction of that day
    marketMetrics.blockNumber = event.block.number;
    marketMetrics.timestamp = event.block.timestamp;
  
    marketMetrics.save();
}

// Update Market entity
export function updateMarket(event: ethereum.Event, 
                             borrowAmount: BigInt=BIGINT_ZERO): void {
    // event must be emitted by the CToken/Market contract
    let marketId = event.address.toHexString()
    // alternatively, get marketId from dataSource.address
    let markets = Factory.bind(Address.fromString(FACTORY_ADDRESS)).getAllMarkets()
    assert(markets.includes(event.address), "Event not emitted by a CToken contract")
    
    let market = getOrCreateMarket(marketId, event)
    if (market != null ) {
        let tokenContract = CErc20.bind(event.address)
        // To get the price of DOLA, fixed at 1
        let DOLADecimals = getOrCreateToken(DOLA_ADDRESS).decimals
        let DOLAPrice = getUnderlyingTokenPrice(Address.fromString(anDOLA_ADDRESS))
        // To get the price of the underlying (input) token
        let tokenDecimals = getOrCreateToken(event.address.toHexString()).decimals
        let inputTokenPrice = getUnderlyingTokenPrice(event.address)
        let inputTokenBalance = tokenContract.totalReserves()
        market.inputTokenBalances = [inputTokenBalance]
        market.inputTokenPricesUSD = [inputTokenPrice]
        market.totalDepositUSD = inputTokenBalance
                                    .toBigDecimal()
                                    .times(inputTokenPrice)
                                    .div(BigInt.fromI32(10 ^ tokenDecimals).toBigDecimal())
        // TODO: Verify assumption correct?
        market.totalValueLockedUSD = market.totalDepositUSD
        market.outputTokenSupply = tokenContract.totalSupply()
        market.outputTokenPriceUSD = BIGDECIMAL_ZERO // Not tradeable & has no price
        market.totalBorrowUSD = tokenContract
                                    .totalBorrows()
                                    .toBigDecimal()
                                    .times(DOLAPrice)
                                    .div(BigInt.fromI32(10 ^ DOLADecimals).toBigDecimal())
        if (borrowAmount != BIGINT_ZERO) {
            let borrowAmountUSD = borrowAmount
                                    .toBigDecimal()
                                    .times(DOLAPrice)
                                    .div(BigInt.fromI32(10 ^ DOLADecimals).toBigDecimal())
            market.totalVolumeUSD = market.totalVolumeUSD.plus(borrowAmountUSD)
        }
        //TODO: It may make sense to merge them into updateMarket?
        //
        //These two are updated in updateMarketEmission
        // triggered by comptroller.DistributedBorrowerComp and
        // DistributedSupplierComp
        //market.rewardTokenEmissionsAmount
        //market.rewardTokenEmissionsUSD
        //These three are updated in updateMarketRates
        //market.depositRate
        //market.stableBorrowRate
        //market.variableBorrowRate

        market.save()

    } else {
        log.warning('Market {} does not exist', [marketId])
    }
}

// Update LendindProtocol entity info
export function updateProtocol(event: ethereum.Event): void {
    let days: string = (event.block.timestamp.toI64() / SECONDS_PER_DAY).toString()
  
    let protocol = getOrCreateProtocol()
    if (protocol == null) {
        log.error("LendingProtocol entity is null{}; something went wrong", [''])
    }

    let factoryContract = Factory.bind(Address.fromString(FACTORY_ADDRESS))
    let marketAddrs = factoryContract.getAllMarkets()

    // sum over AllMarkets
    let totalVolumeUSD = BIGDECIMAL_ZERO
    let totalDepositUSD = BIGDECIMAL_ZERO
    let totalBorrowUSD = BIGDECIMAL_ZERO
    for (let i = 0; i <= marketAddrs.length; i++) {
        let marketId = marketAddrs[i].toHexString()
        let market = Market.load(marketId)

        if (market != null) {
            totalVolumeUSD = totalVolumeUSD.plus(market.totalVolumeUSD)
            totalDepositUSD = totalDepositUSD.plus(market.totalDepositUSD)
            totalBorrowUSD = totalBorrowUSD.plus(market.totalBorrowUSD)
        }
    }
    protocol.totalVolumeUSD = totalVolumeUSD
    protocol.totalDepositUSD = totalDepositUSD
    protocol.totalBorrowUSD = totalBorrowUSD

    protocol.save()
}

export function updateMarketEmission(marketId: string, 
                                     newEmissionAmount: BigInt,
                                     event: ethereum.Event): void {
    let market = getOrCreateMarket(marketId, event);
    if (market == null) {
        log.error("Market {} does not exist.", [marketId]);
    }
    let INVDecimals = getOrCreateToken(INV_ADDRESS).decimals;
    let INVPrice = getUnderlyingTokenPrice(Address.fromString(XINV_ADDRESS));
    // We use mark-to-market accounting here
    let emissionAmount = market.rewardTokenEmissionsAmount![0].plus(newEmissionAmount);
    let emissionUSD = emissionAmount
                       .toBigDecimal()
                       .times(INVPrice)
                       .div(BigInt.fromI32(10 ^ INVDecimals).toBigDecimal())
    market.rewardTokenEmissionsAmount = [emissionAmount]
    market.rewardTokenEmissionsUSD = [emissionUSD]
    market.save()

    let newEmissionUSD = newEmissionAmount.toBigDecimal()
                                          .times(INVPrice)
                                          .div(BigInt.fromI32(10 ^ INVDecimals).toBigDecimal())
    updateFinancialsRevenue(event, newEmissionUSD)
}

export function updateMarketRates(event: ethereum.Event): void {
    let marketId = event.address.toHexString()
    let tokenContract = CErc20.bind(event.address)
    let interestRateModelAddr = tokenContract.interestRateModel()
    let interestRateModelContract = JumpRateModelV2.bind(interestRateModelAddr)
    let cash = tokenContract.getCash()
    let borrows = tokenContract.totalBorrows()
    let reserves = tokenContract.totalReserves()
    let reserveFactorMantissa = tokenContract.reserveFactorMantissa()
    let borrowRate = interestRateModelContract.getBorrowRate(cash, borrows, reserves)
    let depositRate = interestRateModelContract.getSupplyRate(cash, borrows, reserves, reserveFactorMantissa)

    let market = getOrCreateMarket(marketId, event)
    if (market == null) {
        log.error("Market {} does not exist.", [marketId])
    }

    // TODO: As far as I can see, inverse finance has no stableBorrowRate
    // this returns 0
    market.stableBorrowRate = interestRateModelContract.baseRatePerBlock()
                                                       .toBigDecimal()
                                                       .div(MANTISSA_FACTOR)
    market.variableBorrowRate = borrowRate.toBigDecimal()
                                          .div(MANTISSA_FACTOR)
    market.depositRate = depositRate.toBigDecimal()
                                    .div(MANTISSA_FACTOR)
    
    market.save()
}