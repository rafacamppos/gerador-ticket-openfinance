function createMockResponse() {
  return {
    statusCode: null,
    body: null,
    headers: {},
    sent: null,
    ended: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    send(payload) {
      this.sent = payload;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    },
  };
}

module.exports = {
  createMockResponse,
};
