import { Address, ethereum, BigInt, BigDecimal, log } from "@graphprotocol/graph-ts"
import { Factory  } from '../../generated/Factory/Factory'
import { PriceOracle  } from '../../generated/Factory/PriceOracle'
import { CErc20 } from "../../generated/templates/CToken/CErc20"
import { ERC20 } from "../../generated/templates/CToken/ERC20"
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
    INV_ADDRESS,
    ZERO_ADDRESS,
    ProtocolType,
    LendingType,
    RiskType, 
    SECONDS_PER_DAY,
    MANTISSA_FACTOR
} from "../common/constants"

export function getOrCreateToken(id: string): Token {
    let token = Token.load(id)
  
    if (token == null) {
      token = new Token(id)
    
      let contract = CErc20.bind(Address.fromString(id))
      token.name = contract.name()
      token.symbol = contract.symbol()
      token.decimals = contract.decimals()
  
      token.save()
    }
    return token
  }

  // This is currently unnecessary as it can be handled by getOrCreateToken
  export function getOrCreateUnderlyingToken(id: string): Token {   
    let token = Token.load(id)
    if (token == null) {
      token = new Token(id)
      //even the underlying token is not strictly an CERC20, 
      // it should work for the purpose of getting name, symbol, & decimals
      let contract = ERC20.bind(Address.fromString(id)) 
      //let tokenContract = contract.bind(Address.fromString(id))
      token.name = contract.name()
      token.symbol = contract.symbol()
      token.decimals = contract.decimals()
  
      token.save()
    }
    return token
  }

  export function getUnderlyingTokenPrice(cToken: Address): BigDecimal {
    let factoryContract = Factory.bind(Address.fromString(FACTORY_ADDRESS))
    let oracleAddress = factoryContract.oracle() as Address
    let oracleContract = PriceOracle.bind(oracleAddress)
    let underlyingPrice = oracleContract.getUnderlyingPrice(cToken)
                            .toBigDecimal()
                            .div(MANTISSA_FACTOR)

    return underlyingPrice
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
      //protocol.markets
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
      market.rewardTokens = [INV_ADDRESS] //[Token.load(INV_ADDRESS).id]

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

  // Unused
  export function getOrCreateHelperStore(id: string): _HelperStore {
    let store = _HelperStore.load(id)
  
    if (store == null) {
      store = new _HelperStore(id)
      store.valueDecimal = BIGDECIMAL_ZERO
      store.valueInt = INT_ZERO
    }
    return store
  }

  export function getOrCreateFinancialsDailySnapshot(event: ethereum.Event): FinancialsDailySnapshot {
    let days: string = (event.block.timestamp.toI64() / SECONDS_PER_DAY).toString()
    let financialMetrics = FinancialsDailySnapshot.load(days)
    if (financialMetrics == null) {
      financialMetrics = new FinancialsDailySnapshot(days)
      financialMetrics.protocol = FACTORY_ADDRESS
      financialMetrics.protocolControlledValueUSD = BIGDECIMAL_ZERO
      financialMetrics.totalVolumeUSD = BIGDECIMAL_ZERO
      financialMetrics.totalDepositUSD = BIGDECIMAL_ZERO
      financialMetrics.totalBorrowUSD = BIGDECIMAL_ZERO
      financialMetrics.supplySideRevenueUSD = BIGDECIMAL_ZERO
      financialMetrics.protocolSideRevenueUSD = BIGDECIMAL_ZERO
      financialMetrics.totalRevenueUSD = BIGDECIMAL_ZERO
    }
    return financialMetrics
  }
