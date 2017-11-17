module.exports = function ahGateway(collection) {
  return {
    async createHaggle(haggle) {
      return collection
        .insertOne(haggle)
        .then(() => haggle)
    },
    async updateByEmail(demail, updates) {
      const updated = await collection.update({ demail }, { $push: updates })
      return updated
    },
    async deleteDoc(email) {
      const deleted = await collection.deleteOne( { email } )
    },
    async findDoc(email) {
      const found = await collection.findOne({ email })
      return found
    }
  }
}
