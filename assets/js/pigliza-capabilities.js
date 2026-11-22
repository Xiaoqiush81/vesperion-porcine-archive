export const PIGLIZA_CAPABILITIES = Object.freeze([
  Object.freeze({
    id:'choose',
    domains:Object.freeze([
      Object.freeze({
        id:'food',
        terms:Object.freeze({ zh:['吃','饭','外卖','午餐','晚餐','早餐'], en:['eat','food','meal','lunch','dinner','breakfast'] }),
        values:Object.freeze({
          zh:Object.freeze(['热乎乎的面，再加颗蛋','盖饭，有主食有肉，稳稳当当','饺子，煎饺水饺都批准','炸鸡或鸡排饭，今天吃点香香脆脆的']),
          en:Object.freeze(['a warm bowl of noodles with an egg','a rice bowl with something savory','dumplings','fried chicken or a chicken cutlet rice bowl']),
        }),
      }),
    ]),
  }),
]);
