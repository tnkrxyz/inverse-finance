import { Address, ethereum, BigInt } from "@graphprotocol/graph-ts"
//import { Factory } from "../../generated/Factory/Factory"
import { CErc20 } from "../../generated/templates/Market/CErc20"
import {
  Token,
  LendingProtocol,
  Market,
  UsageMetricsDailySnapshot,
  MarketDailySnapshot,
  FinancialsDailySnapshot,
  Account,
  DailyActiveAccount,
  _HelperStore
} from "../../generated/schema"
import { 
    Network,
    BIGDECIMAL_ZERO, 
    BIGINT_ZERO,
    INT_ZERO,
    FACTORY_ADDRESS,
    REWARDTOKEN_ADDRESS,
    ZERO_ADDRESS,
    ProtocolType,
    LendingType,
    RiskType, 
    SECONDS_PER_DAY
} from "../common/constants"
import { log } from '@graphprotocol/graph-ts'

export function getOrCreateToken(id: string): Token {
    let token = Token.load(id)
  
    if (!token) {
      token = new Token(id)
    
      let contract = CErc20.bind(Address.fromString(id))
      token.name = contract.name()
      token.symbol = contract.symbol()
      token.decimals = contract.decimals()
  
      token.save()
    }
    return token
  }

  // This is unnecessary as it can be handled by getOrCreateToken
  export function getOrCreateUnderlyingToken(id: string): Token {   
    let token = Token.load(id)
    if (!token) {
      token = new Token(id)
      //even the underlying token is not strictly an CERC20, 
      // it should work for the purpose of getting name, symbol, & decimals
      let contract = CErc20.bind(Address.fromString(id)) 
      //let tokenContract = contract.bind(Address.fromString(id))
      token.name = contract.name()
      token.symbol = contract.symbol()
      token.decimals = contract.decimals()
  
      token.save()
    }
    return token
  }

  export function getOrCreateProtocol(): LendingProtocol {
    let protocol = LendingProtocol.load(FACTORY_ADDRESS)
  
    if (!protocol) {
      protocol = new LendingProtocol(FACTORY_ADDRESS)
      protocol.name = "Inverse Finance v1"
      protocol.slug = "inverse-finance-v1"
      protocol.schemaVersion = "1.1.0"
      protocol.subgraphVersion = "1.1.0"
      protocol.methodologyVersion = "1.1.0"
      protocol.network = Network.ETHEREUM
      protocol.type = ProtocolType.LENDING
      ////// quantitative data //////
      protocol.totalUniqueUsers = INT_ZERO
      protocol.totalValueLockedUSD = BIGDECIMAL_ZERO
      protocol.totalVolumeUSD = BIGDECIMAL_ZERO
      protocol.totalDepositUSD = BIGDECIMAL_ZERO
      protocol.totalBorrowUSD = BIGDECIMAL_ZERO
      //protocol.usageMetrics
      //protocol.financialMetrics
      protocol.markets = []
      protocol.lendingType = LendingType.CDP
      protocol.riskType = RiskType.GLOBAL
      
      protocol.save()
    }  
    return protocol
  }

  export function getOrCreateMarket(marketAddr: string,
                                    event: ethereum.Event
                                    ): Market {
    
    let market = Market.load(marketAddr)
  
    if (!market) {
      let contract = CErc20.bind(Address.fromString(marketAddr))
      let name = contract.name()
      let asset = ZERO_ADDRESS
      if (contract.symbol() != "anETH") {
        asset = contract.underlying().toHexString()
      }

      market = new Market(marketAddr)
      market.protocol = FACTORY_ADDRESS
      market.inputTokens = [asset]
      market.outputToken = marketAddr //Token.load(marketAddr).id
      market.rewardTokens = [REWARDTOKEN_ADDRESS] //[Token.load(REWARDTOKEN_ADDRESS).id]

      market.totalValueLockedUSD = BIGDECIMAL_ZERO
      market.totalVolumeUSD = BIGDECIMAL_ZERO
      market.totalDepositUSD = BIGDECIMAL_ZERO
      market.totalBorrowUSD = BIGDECIMAL_ZERO
      market.inputTokenBalances = [BIGINT_ZERO]
      market.inputTokenPricesUSD = [BIGDECIMAL_ZERO]
      market.outputTokenSupply = BIGINT_ZERO
      market.outputTokenPriceUSD = BIGDECIMAL_ZERO
      market.rewardTokenEmissionsAmount = [BIGINT_ZERO]
      market.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO]

      //market.snapshots
      market.name = name
      // markets[address].isListed never resets after set to true
      //QQQ: Should borrowing/minting/transfering pauses considered inactive? 
      market.isActive = true
      market.canUseAsCollateral = false
      market.canBorrowFrom = true //borrowGuardianPaused is default to false
      market.maximumLTV = BIGDECIMAL_ZERO
      market.liquidationThreshold = BIGDECIMAL_ZERO
      market.liquidationPenalty = BIGDECIMAL_ZERO
      market.depositRate = BIGDECIMAL_ZERO
      market.stableBorrowRate = BIGDECIMAL_ZERO
      market.variableBorrowRate = BIGDECIMAL_ZERO
      //market.deposits
      //market.withdraws
      //market.borrows
      //market.repays
      //market.liquidates
    }

    market.createdTimestamp = event.block.timestamp
    market.createdBlockNumber = event.block.number
    market.save()
    
    return market
  }

  export function getOrCreateHelperStore(id: string): _HelperStore {
    let store = _HelperStore.load(id)
  
    if (store == null) {
      store = new _HelperStore(id)
      store.valueDecimal = BIGDECIMAL_ZERO
      store.valueInt = INT_ZERO
    }
    return store
  }
  export function getOrCreateUsageMetricSnapshot(event: ethereum.Event): UsageMetricsDailySnapshot{
/*     // Number of days since Unix epoch
    let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

    // Create unique id for the day
    let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());
  
    if (!usageMetrics) {
        usageMetrics = new UsageMetricsDailySnapshot(id.toString());
        usageMetrics.protocol = dataSource.address();
  
        usageMetrics.activeUsers = INT_ZERO;
        usageMetrics.totalUniqueUsers = INT_ZERO;
        usageMetrics.dailyTransactionCount = INT_ZERO;
        usageMetrics.save()
    }

    return usageMetrics */
}

export function getOrCreateMarketDailySnapshot(event: ethereum.Event): MarketDailySnapshot {
/*     let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
    let marketAddress = event.address.toHexString()
    let marketMetrics = MarketDailySnapshot.load(marketAddress.concat("-").concat(id.toString()));
    
    if (!marketMetrics) {
        marketMetrics = new MarketDailySnapshot(marketAddress.concat("-").concat(id.toString()));
        marketMetrics.protocol = FACTORY_ADDRESS;
        marketMetrics.market = marketAddress;
        marketMetrics.rewardTokenEmissionsAmount = []
        marketMetrics.rewardTokenEmissionsUSD = []

        marketMetrics.save()
    }

    return marketMetrics */
}

export function getOrCreateFinancials(event: ethereum.Event): FinancialsDailySnapshot {
    // Number of days since Unix epoch
/*     let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

    let financialMetrics = FinancialsDailySnapshot.load(id.toString());
  
    if (!financialMetrics) {
        financialMetrics = new FinancialsDailySnapshot(id.toString());
        financialMetrics.protocol = dataSource.address();
  
        financialMetrics.feesUSD = BIGDECIMAL_ZERO
        financialMetrics.totalVolumeUSD = BIGDECIMAL_ZERO
        financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO
        financialMetrics.supplySideRevenueUSD = BIGDECIMAL_ZERO
        financialMetrics.protocolSideRevenueUSD = BIGDECIMAL_ZERO

        financialMetrics.save()
    }
    return financialMetrics */
}


/* export function getOrCreateAccount(id: string): Account {
  // id: string = address
  let account = Account.load(id)
  if (!account) {
    account = new Account(id)
    account.save()
  }
  return account
}

export function getOrCreateDailyActiveAccount(id: string): DailyActiveAccount {
  // id: string = `{Number of days since Unix epoch}-{address}`
  let dailyActiveAccount = DailyActiveAccount.load(id)
  if (!dailyActiveAccount) {
    dailyActiveAccount = new DailyActiveAccount(id)
    dailyActiveAccount.save()
  }
  
  return dailyActiveAccount
} */