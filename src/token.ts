import { Address } from '@graphprotocol/graph-ts'
import { RewardToken } from "../generated/schema"
import { INV, OwnerChanged } from '../generated/INV/INV'
import { ZERO_ADDRESS, RewardTokenType } from './common/constants'

export function handleOwnerChanged(event: OwnerChanged): void {
    // this only happens when the constructor() of the INV contract is called
    if (event.params.owner == Address.fromString(ZERO_ADDRESS)) {
        let tokenContract = INV.bind(event.address)

        let tokenId = event.address.toHexString()
        let rewardToken = RewardToken.load(tokenId)

        if (rewardToken == null) {
            rewardToken = new RewardToken(tokenId)
            rewardToken.name = tokenContract.name()
            rewardToken.symbol = tokenContract.symbol()
            rewardToken.decimals = tokenContract.decimals()
            rewardToken.type = RewardTokenType.DEPOSIT
        }

        rewardToken.save()
  }
}