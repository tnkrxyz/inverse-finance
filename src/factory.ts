import { Address } from '@graphprotocol/graph-ts'
import { 
  Factory, 
  MarketListed, 
  ActionPaused1, 
  NewCloseFactor, 
  NewCollateralFactor, 
  NewLiquidationIncentive
} from '../generated/Factory/Factory';
import { MANTISSA_FACTOR, BIGDECIMAL_ONE, FACTORY_ADDRESS } from './common/constants';
import { 
  getOrCreateProtocol, 
  getOrCreateToken, 
  getOrCreateUnderlyingToken, 
  getOrCreateMarket 
} from "./common/getters"
import { CToken } from '../generated/templates'
import { CErc20 } from '../generated/templates/CToken/CErc20'
import { Market } from '../generated/schema'
import { log } from '@graphprotocol/graph-ts'

export function handleMarketListed(event: MarketListed): void {
    //let protocol = getOrCreateProtocol()
    let tokenContract = CErc20.bind(event.params.cToken)
    getOrCreateToken(event.params.cToken.toHexString())
    // Create underlying tokens: YFI, xSUSHI, WBTC, DOLA, ...
    // There is no underlying token for anETH (ETH)
    if (tokenContract.name() != "anETH") {
      //getOrCreateUnderlyingToken(tokenContract.underlying().toHexString())
      getOrCreateToken(tokenContract.underlying().toHexString())
    }
    
    let marketAddr = event.params.cToken.toHexString()
    let market = getOrCreateMarket(marketAddr, event)

    // trigger Token templates
    CToken.create(event.params.cToken)
}

export function handleMintBorrowPaused(event: ActionPaused1): void {
  // reset market.canBorrowFrom with ActionPaused event
  if (event.params.action == 'Borrow') {
    let marketId = event.params.cToken.toHexString()
    let market = Market.load(marketId)
    if (market != null) {
      market.canBorrowFrom = !event.params.pauseState
      market.save()
    }  else {
      log.warning("Market {} does not exist.", [marketId])
    }
  }
}

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  let marketId = event.params.cToken.toHexString()
  let market = Market.load(marketId)
  if (market != null) {
    let ltvFactor = event.params.newCollateralFactorMantissa
      .toBigDecimal()
      .div(MANTISSA_FACTOR)
    market.maximumLTV = ltvFactor
    market.liquidationThreshold = ltvFactor
    market.save()
  } else {
    log.warning("Market {} does not exist.", [marketId])
  }
}

export function handleNewCloseFactor(event: NewCloseFactor): void {
  // Nothing we need here
}

export function handleNewLiquidationIncentive(event: NewLiquidationIncentive): void {
  
  let factoryContract = Factory.bind(Address.fromString(FACTORY_ADDRESS))
  let marketAddrs = factoryContract.getAllMarkets()
  for (let i = 0; i <= marketAddrs.length; i++) {
    let marketId = marketAddrs[i].toHexString()
    let market = Market.load(marketId)

    if (market != null) {
      let liquidationPenalty = event.params.newLiquidationIncentiveMantissa
        .toBigDecimal()
        .div(MANTISSA_FACTOR)
        .minus(BIGDECIMAL_ONE)
      market.liquidationPenalty = liquidationPenalty
      market.save()
    } else {
      log.warning("Market {} does not exist.", [marketId])
    }
  }
}
