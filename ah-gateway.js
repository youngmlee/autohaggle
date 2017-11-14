module.exports = function ahGateway(collection) {
  return {
    async createHaggle(haggle) {
      return collection
        .insertOne(haggle)
        .then(() => haggle)
    }
  }
}
