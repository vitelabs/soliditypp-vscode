class Task {
    _taskTimer
    _taskInterval
    _task

    constructor (task, interval) {
        this._task = task;
        this._taskInterval = interval;

        return this;
    }

    _run () {
        this._taskTimer = setTimeout(async () => {
            if (!this._task) {
                return;
            }
            if (!(await this._task())) {
                return;
            }
            this._run();
        }, this._taskInterval);
    }

    start () {
        if (this._taskTimer) {
            return;
        }
        
        this._run();
    }


    stop () {
        if (!this._taskTimer) {
            return;
        }    
        window.clearTimeout(this._taskTimer);
        this._taskTimer = undefined;
    }
}

module.exports = Task;
