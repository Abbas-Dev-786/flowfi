import NonFungibleToken from 0x631e88ae7f1d7c20
import MyNFT from 0x3fe32988f9457b01

transaction(recipient: Address, name: String, description: String, thumbnail: String) {
    let minter: &MyNFT.NFTMinter
    let recipientCollection: &{NonFungibleToken.CollectionPublic}

    prepare(signer: auth(Storage) &Account) {
        self.minter = signer.storage.borrow<&MyNFT.NFTMinter>(from: MyNFT.MinterStoragePath)
            ?? panic("Signer is not the NFTMinter")

        self.recipientCollection = getAccount(recipient)
            .capabilities.get<&{NonFungibleToken.CollectionPublic}>(MyNFT.CollectionPublicPath)
            .borrow()
            ?? panic("Recipient does not have a collection")
    }

    execute {
        self.minter.mintNFT(
            recipient: self.recipientCollection,
            name: name,
            description: description,
            thumbnail: thumbnail
        )
    }
}