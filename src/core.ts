import { dataSource, ethereum, Address, BigDecimal } from '@graphprotocol/graph-ts';
import { Factory } from '../generated/Factory/Factory'
import {
    DOLA_ADDRESS,
    LendingType,
    RiskType,
    FACTORY_ADDRESS,
    BIGDECIMAL_ZERO,
    SECONDS_PER_DAY,
    HelperStoreType
} from "./common/constants"
//import { getOrCreateProtocol, getOrCreateAccount, getOrCreateDailyActiveAccount } from "./common/getters"
import { 
    CErc20, Mint, Redeem, Borrow, RepayBorrow, LiquidateBorrow 
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
import { getOrCreateProtocol, 
    getOrCreateMarket,
    getOrCreateHelperStore } from './common/getters'
//import { HelperStoreType } from './common/constants';
import { 
    createDeposit,
    createWithdraw,
    createBorrow,
    createRepay,
    createLiquidate,
    updateUsageMetrics,
    updateMarket
} from './common/helpers'

export function handleMint(event: Mint): void {
    let user = event.params.minter
    createDeposit(event)
    updateUsageMetrics(event, user)
    updateMarket(event)
}

export function handleRedeem(event: Redeem): void {
    let user = event.params.redeemer
    createWithdraw(event)
    updateUsageMetrics(event, user)
    updateMarket(event)
}

export function handleBorrow(event: Borrow): void {
    let user = event.params.borrower
    let borrowAmount = event.params.borrowAmount
    createBorrow(event)
    updateUsageMetrics(event, user)
    /*
    let totalVolumeStore = getOrCreateHelperStore(HelperStoreType.TOTALVOLUME)
    let totalVolume = totalVolumeStore!.valueDecimal!.plus(amount.toBigDecimal()) //TODO
    totalVolumeStore.valueDecimal = totalVolume
    totalVolumeStore.save()
    */
    let borrowVolumeUSD = borrowAmount.toBigDecimal().times(BIGDECIMAL_ZERO) //TODO
    updateMarket(event, borrowVolumeUSD)
}

export function handleRepayBorrow(event: RepayBorrow): void {
    let user = event.params.payer
    createRepay(event)
    updateUsageMetrics(event, user)
    updateMarket(event)
}

export function handleLiquidateBorrow(event: LiquidateBorrow): void {
    let user = event.params.liquidator
    createLiquidate(event)
    updateUsageMetrics(event, user)
    updateMarket(event)
}