class Status {
  constructor(options) {
    this.values = { source: null, started: new Date(), state: "pending" };
    this.set(options);
    return this;
  }
  set(options) {
    this.values = { ...this.values, ...options };
    for (let key in this.values) {
      if (this.values[key] === null) {
        delete this.values[key];
      }
    }
    return this;
  }
  get(value) {
    if (value) return this.values[value];
    this.set({ elapsed: new Date() - this.values.started });
    return this.values;
  }
}
module.exports = { Status };
