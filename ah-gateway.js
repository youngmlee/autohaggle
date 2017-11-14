module.exports = function ahGateway(collection) {
  return {
    async createHaggle(haggle) {
      return collection
        .insertOne(haggle)
        .then(() => haggle)
    },
    async display() {
      const foundDisplay = await collection.find().toArray()
      return foundDisplay
    },
  }
}
