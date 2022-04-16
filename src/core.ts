import { dataSource, ethereum, Address, BigDecimal } from '@graphprotocol/graph-ts';
import { Factory } from '../generated/Factory/Factory'
import { updateMarketRates } from './common/helpers';
import {
    DOLA_ADDRESS,
    LendingType,
    RiskType,
    FACTORY_ADDRESS,
    BIGDECIMAL_ZERO,
    SECONDS_PER_DAY,
    HelperStoreType
} from "./common/constants"

import { 
    Mint, 
    Redeem, 
    Borrow, 
    RepayBorrow, 
    LiquidateBorrow,
    NewMarketInterestRateModel
} from '../generated/templates/CToken/CErc20'
import { 
    Account,
    DailyActiveAccount,
    Market, 
    Deposit, 
    Withdraw, 
    Borrow as BorrowSC, 
    Repay, 
    Liquidate
} from '../generated/schema'
import { 
    createDeposit,
    createWithdraw,
    createBorrow,
    createRepay,
    createLiquidate,
    updateUsageMetrics,
    updateMarket,
    updateMarketMetrics,
    updateFinancials,
    updateProtocol
} from './common/helpers'

export function handleMint(event: Mint): void {
    let user = event.params.minter
    createDeposit(event)
    updateMarket(event)
    updateMarketRates(event)
    updateUsageMetrics(event, user)
    updateMarketMetrics(event)
    updateFinancials(event)
    updateProtocol(event)
}

export function handleRedeem(event: Redeem): void {
    let user = event.params.redeemer
    createWithdraw(event)
    updateMarket(event)
    updateMarketRates(event)
    updateUsageMetrics(event, user)
    updateMarketMetrics(event)
    updateFinancials(event)
    updateProtocol(event)
}

export function handleBorrow(event: Borrow): void {
    let user = event.params.borrower
    let borrowAmount = event.params.borrowAmount
    createBorrow(event)
    updateMarket(event, borrowAmount)
    updateMarketRates(event)
    updateUsageMetrics(event, user)
    updateMarketMetrics(event)
    updateFinancials(event)
    updateProtocol(event)
}

export function handleRepayBorrow(event: RepayBorrow): void {
    let user = event.params.payer
    createRepay(event)
    updateMarket(event)
    updateMarketRates(event)
    updateUsageMetrics(event, user)
    updateMarketMetrics(event)
    updateFinancials(event)
    updateProtocol(event)
}

export function handleLiquidateBorrow(event: LiquidateBorrow): void {
    let user = event.params.liquidator
    createLiquidate(event)
    updateMarket(event)
    updateMarketRates(event)
    updateUsageMetrics(event, user)
    updateMarketMetrics(event)
    updateFinancials(event)
    updateProtocol(event)
}