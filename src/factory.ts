import {
  Address,
  log,
} from "@graphprotocol/graph-ts"
import { CToken } from "../generated/templates"
import {
  Factory,
  MarketListed,
  ActionPaused1,
  NewCloseFactor,
  NewCollateralFactor,
  NewLiquidationIncentive,
  DistributedBorrowerComp,
  DistributedSupplierComp,  
} from "../generated/Factory/Factory";
import {
  MANTISSA_DECIMALS,
  BIGDECIMAL_ONE,
  FACTORY_ADDRESS,
} from "./common/constants";
import {
  getOrCreateToken,
  getOrCreateUnderlyingToken,
  getOrCreateMarket,
  getOrCreateProtocol
} from "./common/getters";
import { Market } from "../generated/schema";
import { updateMarketEmission, decimalsToBigDecimal } from './common/helpers';

export function handleMarketListed(event: MarketListed): void {
  let protocol = getOrCreateProtocol()
  
  getOrCreateToken(event.params.cToken)
  getOrCreateUnderlyingToken(event.params.cToken)

  let marketAddr = event.params.cToken.toHexString();
  getOrCreateMarket(marketAddr, event);

  // trigger CToken template
  CToken.create(event.params.cToken)
}

export function handleMintBorrowPaused(event: ActionPaused1): void {
  // reset market.canBorrowFrom with ActionPaused event
  if (event.params.action == "Borrow") {
    let marketId = event.params.cToken.toHexString();
    let market = Market.load(marketId);
    if (market != null) {
      market.canBorrowFrom = !event.params.pauseState;
      market.save();
    } else {
      log.warning("Market {} does not exist.", [marketId]);
    }
  }
}

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  let marketId = event.params.cToken.toHexString();
  let market = Market.load(marketId);
  if (market != null) {
    let ltvFactor = event.params.newCollateralFactorMantissa
      .toBigDecimal()
      .div(decimalsToBigDecimal(MANTISSA_DECIMALS));
    // TODO: Verify assumption correct?
    market.maximumLTV = ltvFactor;
    market.liquidationThreshold = ltvFactor;
    market.save();
  } else {
    log.warning("Market {} does not exist.", [marketId]);
  }
}

export function handleNewCloseFactor(event: NewCloseFactor): void {
  // The liquidator may not repay more than what is allowed by the closeFactor
  // Nothing we need here
}

export function handleNewLiquidationIncentive(
  event: NewLiquidationIncentive
): void {
  let factoryContract = Factory.bind(Address.fromString(FACTORY_ADDRESS));
  let marketAddrs = factoryContract.getAllMarkets();
  for (let i = 0; i < marketAddrs.length; i++) {
    let marketId = marketAddrs[i].toHexString();
    let market = Market.load(marketId);

    if (market != null) {
      let liquidationPenalty = event.params.newLiquidationIncentiveMantissa
        .toBigDecimal()
        .div(decimalsToBigDecimal(MANTISSA_DECIMALS))
        .minus(BIGDECIMAL_ONE);
      market.liquidationPenalty = liquidationPenalty;

      market.save();
    } else {
      log.warning("Market {} does not exist.", [marketId]);
    }
  }
}

export function handleDistributedBorrowerComp(
  event: DistributedBorrowerComp
): void {
  let marketId = event.params.cToken.toHexString();
  let newEmissionAmount = event.params.compDelta;
  updateMarketEmission(marketId, newEmissionAmount, event);
}

export function handleDistributedSupplierComp(
  event: DistributedSupplierComp
): void {
  let marketId = event.params.cToken.toHexString();
  let newEmissionAmount = event.params.compDelta;
  updateMarketEmission(marketId, newEmissionAmount, event);
}
