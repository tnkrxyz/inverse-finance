import { ethereum, DataSource, DataSourceContext } from "@graphtoken/graph-ts"
import {
  Token,
  LendingProtocol,
  Market,
  UsageMetricsDailySnapshot,
  MarketDailySnapshot,
  FinancialsDailySnapshot
} from "../../generated/schema"
import { CErc20 } from "../../generated/templates/Market/CErc20"
import { 
    BIGDECIMAL_ZERO, 
    BIGINT_ZERO,
    INT_ZERO, 
    Network, 
    REWARDTOKEN_ADDRESS, 
    ProtocolType, 
    SECONDS_PER_DAY 
} from "../common/constants"

export function getOrCreateToken(id: string, contract: ethereum.SmartContract): Token {
    let token = Token.load(id)
  
    if (!token) {
      token = new Token(id)
    
      //let tokenContract = contract.bind(Address.fromString(id))
      token.name = contract.name()
      token.symbol = contract.symbol()
      token.decimals = contract.decimals()
  
      token.save()
    }
    return token
  }

  export function getOrCreateLendingProtocol(factoryAddress: string): LendingProtocol {
    let protocol = LendingProtocol.load(factoryAddress)
  
    if (!protocol) {
      protocol = new LendingProtocol(factoryAddress)
      protocol.name = "Inverse Finance v1"
      protocol.slug = "inverse-finance-v1"
      protocol.schemaVersion = "1.1.0"
      protocol.subgraphVersion = "1.1.0"
      protocol.totalValueLockedUSD = BIGDECIMAL_ZERO
      protocol.network = Network.ETHEREUM
      protocol.type = ProtocolType.LENDING
  
      protocol.save()
    }  
    return protocol
  }

  export function getOrCreateMarket(marketAddr: string, 
                                    protocol: LendingProtocol,
                                    tokenContract: CErc20,
                                    context: DataSourceContext
                                    ): Market {
    let market = Market.load(marketAddr)
  
    if (!market) {
      market = new Market(marketAddr)
      market.protocol = protocol.id
      market.inputTokens = [tokenContract.underlying().toHexString()]
      market.outputToken = Token.load(marketAddr).id
      market.rewardTokens = [Token.load(REWARDTOKEN_ADDRESS).id]

      market.totalValueLockedUSD = BIGDECIMAL_ZERO
      market.totalVolumeUSD = BIGDECIMAL_ZERO
      market.totalDepositUSD = BIGDECIMAL_ZERO
      market.totalBorrowUSD = BIGDECIMAL_ZERO
      market.inputTokenBalances = [BIGINT_ZERO]
      market.inputTokenPricesUSD = [BIGDECIMAL_ZERO]
      market.outputTokenSupply = BIGINT_ZERO
      market.outputTokenPriceUSD = BIGDECIMAL_ZERO
      market.rewardTokenEmissionsAmount = BIGINT_ZERO
      market.rewardTokenEmissionsUSD = BIGDECIMAL_ZERO
      market.createdTimestamp = 
      market.createdBlockNumber = 

      market.snapshots = []
      market.name = tokenContract.name()
      market.isActive = tokenContract.isListed()
      market.canUseAsCollateral
      market.canBorrowFrom
      market.maximumLTV
      market.liquidationThreshold
      market.liquidationPenalty
      market.depositRate
      market.stableBorrowRate
      market.variableBorrowRate
      market.deposits = []
      market.withdraws = []
      market.borrows = []
      market.repays = []
      market.liquidations = []

      market.save()
    }  
    return market
  }

  export function getOrCreateUsageMetricSnapshot(event: ethereum.Event): UsageMetricsDailySnapshot{
    // Number of days since Unix epoch
    let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

    // Create unique id for the day
    let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());
  
    if (!usageMetrics) {
        usageMetrics = new UsageMetricsDailySnapshot(id.toString());
        usageMetrics.protocol = FACTORY_ADDRESS;
  
        usageMetrics.activeUsers = INT_ZERO;
        usageMetrics.totalUniqueUsers = INT_ZERO;
        usageMetrics.dailyTransactionCount = INT_ZERO;
        usageMetrics.save()
    }

    return usageMetrics
}

export function getOrCreateMarketDailySnapshot(event: ethereum.Event): MarketDailySnapshot {
    let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
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

    return marketMetrics
}

export function getOrCreateFinancials(event: ethereum.Event): FinancialsDailySnapshot {
    // Number of days since Unix epoch
    let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

    let financialMetrics = FinancialsDailySnapshot.load(id.toString());
  
    if (!financialMetrics) {
        financialMetrics = new FinancialsDailySnapshot(id.toString());
        financialMetrics.protocol = FACTORY_ADDRESS;
  
        financialMetrics.feesUSD = BIGDECIMAL_ZERO
        financialMetrics.totalVolumeUSD = BIGDECIMAL_ZERO
        financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO
        financialMetrics.supplySideRevenueUSD = BIGDECIMAL_ZERO
        financialMetrics.protocolSideRevenueUSD = BIGDECIMAL_ZERO

        financialMetrics.save()
    }
    return financialMetrics
}