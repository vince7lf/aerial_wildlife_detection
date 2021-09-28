# AI backend setup

AIDE uses [Celery](http://www.celeryproject.org) to distribute jobs (train, inference, etc.) to the individual _AIWorker_(s), which in turn requires a message broker to keep track of the jobs, status messages, and the like.
You can use any [supported message broker](http://docs.celeryproject.org/en/latest/getting-started/brokers/index.html) with AIDE, but be wary that the result backend **must** support persistent, shareable messages (i.e., everything except the [RPC](https://docs.celeryproject.org/en/latest/internals/reference/celery.backends.rpc.html) backend is supported). The default, recommended configuration is:
* Using [RabbitMQ](http://docs.celeryproject.org/en/latest/getting-started/brokers/rabbitmq.html) as the message broker, and
* using [Redis](https://docs.celeryproject.org/en/latest/getting-started/brokers/redis.html#results) as a result backend.


The steps below install servers for both RabbitMQ and Redis on the machine running the _AIController_ instance. This usually causes no bottlenecks, as AIDE spawns a minuscule number of jobs. However, if you wish you can of course employ another dedicated machine or two for RabbitMQ and Redis accordingly. Just replace the hostnames wherever needed.


## Preparations

### Open ports

Define network ports for both RabbitMQ and Redis. Default values:
* RabbitMQ: `5672`
* Redis: `6379`

Make sure the ports are open for any machine running an _AIController_ or _AIWorker_ module.


### Install requirements

The required libraries for the message broker can be installed e.g. using pip:
```bash
    conda activate aide
    pip install celery[librabbitmq,redis,auth,msgpack]
    # do not install librabbitmq; triggers TypeError: can't pickle memoryview objects #4693
    # refer to https://github.com/celery/celery/issues/4693
    pip install celery[pyamqp,redis,auth,msgpack]
```



## Setup RabbitMQ

Carry out these steps on the instance running the _AIController_ module:
```bash
    # define RabbitMQ access credentials. NOTE: replace defaults with your own values
    username=aide
    password=password

    # install RabbitMQ server
    sudo apt-get update && sudo apt-get install -y rabbitmq-server

    # optional: if the port for RabbitMQ is anything else than 5672, execute the following line:
    port=5672   # replace with your port
    sudo sed -i "s/^\s*#\s*NODE_PORT\s*=.*/NODE_PORT=$port/g" /etc/rabbitmq/rabbitmq-env.conf

    # start RabbitMQ server
    sudo systemctl enable rabbitmq-server.service
    sudo service rabbitmq-server start

    # install Celery (if not already done)
    conda activate aide
    pip install celery[librabbitmq,redis,auth,msgpack]

    # add the user we defined above
    sudo rabbitmqctl add_user $username $password

    # add new virtual host
    sudo rabbitmqctl add_vhost aide_vhost

    # set permissions
    sudo rabbitmqctl set_permissions -p aide_vhost $username ".*" ".*" ".*"

    # restart
    sudo service rabbitmq-server stop       # may take a minute; if the command hangs: sudo pkill -KILL -u rabbitmq
    sudo service rabbitmq-server start
```



## Setup Redis

Also on the _AIController_ machine, run the following code:
```bash
    sudo apt-get update && sudo apt-get install -y redis-server

    # make sure Redis stores its messages in an accessible folder (we're using /var/lib/redis/aide.rdb here)
    sudo sed -i "s/^\s*dir\s*.*/dir \/var\/lib\/redis/g" /etc/redis/redis.conf
    sudo sed -i "s/^\s*dbfilename\s*.*/dbfilename aide.rdb/g" /etc/redis/redis.conf

    # also tell systemd
    sudo mkdir -p /etc/systemd/system/redis.service.d
    echo -e "[Service]\nReadWriteDirectories=-/var/lib/redis" | sudo tee -a /etc/systemd/system/redis.service.d/override.conf > /dev/null

    sudo mkdir -p /var/lib/redis
    sudo chown -R redis:redis /var/lib/redis

    # disable persistence. In general, we don't need Redis to save snapshots as it is only used as a result
    # (and therefore message) backend.
    sudo sed -i "s/^\s*save/# save /g" /etc/redis/redis.conf

    # optional: if the port is anything else than 6379, execute the following line:
    port=6379   # replace with your port
    sudo sed -i "s/^\s*port\s*.*/port $port/g" /etc/redis/redis.conf

    # restart
    sudo systemctl daemon-reload
    sudo systemctl enable redis-server.service
    sudo systemctl restart redis-server.service
```


At this point you may want to test Redis:
1. From the machine running the _AIController_ instance:
  ```bash
    # replace the port accordingly
    port=6379

    redis-cli -h localhost -p $port ping
    # > PONG
    redis-cli -h localhost -p $port set test "Hello, world"
    # > OK
  ```

2. From a machine running the _AIWorker_ instance (this also verifies that Redis is accessible over the network):
    ```bash
        # replace the host and port accordingly
        host=aicontroller.mydomain.net
        port=6379

        redis-cli -h $host -p $port ping
        # > PONG
        redis-cli -h $host -p $port get test
        # > "Hello, world"
    ```


## Configure TCP keepalive settings

As is the case for the [database](setup_db.md), also the message broker and result backend instance(s) _might_ require you to set TCP keepalive options, e.g. when run on [MS Azure](https://docs.microsoft.com/en-us/azure/load-balancer/load-balancer-outbound-connections#idletimeout).
Run the following code block for your _AIController_ instance, resp. for the machine(s) running RabbitMQ and/or Redis.

```bash
    if ! sudo grep -q ^net.ipv4.tcp_keepalive_* /etc/sysctl.conf ; then
        echo "net.ipv4.tcp_keepalive_time = 60" | sudo tee -a "/etc/sysctl.conf" > /dev/null
        echo "net.ipv4.tcp_keepalive_intvl = 60" | sudo tee -a "/etc/sysctl.conf" > /dev/null
        echo "net.ipv4.tcp_keepalive_probes = 20" | sudo tee -a "/etc/sysctl.conf" > /dev/null
    else
        sudo sed -i "s/^\s*net.ipv4.tcp_keepalive_time.*/net.ipv4.tcp_keepalive_time = 60 /g" /etc/sysctl.conf
        sudo sed -i "s/^\s*net.ipv4.tcp_keepalive_intvl.*/net.ipv4.tcp_keepalive_intvl = 60 /g" /etc/sysctl.conf
        sudo sed -i "s/^\s*net.ipv4.tcp_keepalive_probes.*/net.ipv4.tcp_keepalive_probes = 20 /g" /etc/sysctl.conf
    fi
    sudo sysctl -p
```


## Add settings

As a last step, the appropriate settings need to be added to the [configuration *.ini file](configure_settings.md), replacing all tokens in angular brackets with what you set above:

```ini
    [AIController]

    broker_url = amqp://<rabbitmq_user>:<rabbitmq_password>@<rabbitmq_host>:<rabbitmq_port>/aide_vhost
    result_backend = redis://<redis_host>:<redis_port>/0
    
    broker_URL = amqp://aide:password@localhost:6379/aide_vhost
    result_backend = redis://localhost:6379/0

```

Notes:
* By default, `<rabbitmq_host>` and `<redis_host>` refer to the host address of the _AIController_ instance, unless you decided to employ another machine as the RabbitMQ, resp. Redis server.
* `aide_vhost` is the virtual host assigned to RabbitMQ above.
* `/0` designates the channel of Redis. Change this accordingly if you happen to run another service (e.g. another instance of AIDE) running through this Redis server already.
