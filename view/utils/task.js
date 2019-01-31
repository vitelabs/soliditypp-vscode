class Task {
    data 
    _taskTimer
    _taskInterval
    _task

    constructor () {
        return this;
    }

    _run () {
        this.taskInterval = setTimeout(() => {
            if (!this._task) {
                return;
            }
            this._task();
            this._run();
        }, this._interval);
    }

    start (task, interval) {
        if (this._taskTimer) {
            return;
        }
        this._task = task;
        this._taskInterval = interval;
        this._run();
    }


    stop () {
        if (!this._taskTimer) {
            return;
        }    
        window.clearTimeout(this._taskTimer);
        this._taskTimer = undefined;
        this._task = undefined;
        this._taskInterval = undefined;
        this.data = undefined;
    }
}

module.exports = Task;
