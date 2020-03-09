class Observer {
    constructor(data) {
        this.data = data;
        this.walk(data);
    }

    /* 核心方法 */
    /* 遍历data中所有的数据，都添加上getter和setter */
    walk(data) {
        if (!data || typeof data !== 'object') return;

        Object.keys(data).forEach(key => {
            // 给data对象的key设置getter和setter
            this.defineReactive(data, key, data[key]);
            // 如果对象中还有对象递归遍历对象
            this.walk(data[key]);
        })
    }

    defineReactive(data, key, value) {
        // defineProperty 中的this指的是Object
        let that = this;
        let dep = new Dep();
        Object.defineProperty(data, key, {
            configurable: true,
            enumerable: true,
            get() {
                Dep.target && dep.addSub(Dep.target);
                return value;
            },
            set(newVal) {
                // 如果新值等于旧值的话 不做改变
                if (value === newVal) return;
                value = newVal;
                // 如果newVla是对象的话，也要进行数据劫持
                that.walk(newVal);

                dep.notify();
            }
        })
    }
}