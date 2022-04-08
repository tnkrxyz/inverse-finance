import { Address } from '@graphprotocol/graph-ts'
import { Token } from "../generated/schema"
import { INV, OwnerChanged } from '../generated/INV/INV'

export function handleOwnerChanged(event: OwnerChanged): void {
  // this only happens when the constructor() is called
  if (event.params.owner == Address.fromString("0x0000000000000000000000000000000000000000")) {
    let entity = new Token(event.address.toHexString())

    let contract = INV.bind(event.address)
    entity.name = contract.name()
    entity.symbol = contract.symbol()
    entity.decimals = contract.decimals()

    entity.save()
  }
}