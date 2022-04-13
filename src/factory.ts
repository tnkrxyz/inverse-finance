import { dataSource, DataSourceContext } from '@graphprotocol/graph-ts'
import { Factory, MarketListed } from '../generated/Factory/Factory'
//import { Network, ZERO_ADDRESS, ProtocolType } from "./common/constants"
import { getOrCreateLendingProtocol, getOrCreateToken } from "./common/getters"
import { Market } from '../generated/templates'
import { CErc20 } from '../generated/templates/Market/CErc20'

export function handleMarketListed(event: MarketListed): void {
    let protocol = getOrCreateLendingProtocol(dataSource.source.address.toHexString())
    let factoryContract = Factory.bind(event.address)
    let tokenContract = CErc20.bind(event.params.cToken)
    let token = getOrCreateToken(event.params.cToken.toHexString(), tokenContract)

    let context = new DataSourceContext()
    context.setString('protocol', protocol.id)
    context.setString('token', token.id)
    context.setString('underlying', tokenContract.underlying().toHexString())
    context.setBoolean('isActive', factoryContract.markets(event.params.cToken).value0)
    Market.createWithContext(event.params.cToken, context)

}

