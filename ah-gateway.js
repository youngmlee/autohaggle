module.exports = function ahGateway(collection) {
  return {
    async display() {
      const foundDisplay = await collection.find().toArray()
      return foundDisplay
    },
    async createHaggle(haggle) {
      return collection
        .insertOne(haggle)
        .then(() => haggle)
    }
  }
}
