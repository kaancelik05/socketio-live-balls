app.controller('indexController', ['$scope', 'indexFactory', ($scope, indexFactory) => {

    $scope.messages = [];
    $scope.players = {};

    $scope.init = () => {
        const username = prompt('Please enter username');

        if (username)
            initSocket(username); 
        else
            return false;
    };

    function scrollTop() {
        setTimeout(() => {
            const element = document.getElementById('chat-area');
            element.scrollTop = element.scrollHeight;
        });
    }

    function showBubble(id, message){
        $('#'+id).find('.message').show().html(message);
        setTimeout(() => {
            $('#'+id).find('.message').hide()
        },2000);
    }

    function initSocket(username) {
        const connectionOptions = {
            reconnectionAttempts: 3,
            reconnectionDelay: 500
        };

        indexFactory.connectSocket('https://live-chat-with-balls.herokuapp.com/', connectionOptions)
            .then((socket) => {
                socket.emit('newUser', { username });

                socket.on('initPlayers', (players) => {
                    $scope.players = players;
                    $scope.$apply();
                })

                socket.on('newUser', (data) => {
                    const messageData = {
                        type: {
                            code: 0, // server
                            message: 1 // login
                        },
                        username: data.username
                    };

                    $scope.messages.push(messageData);
                    $scope.players[data.id] = data;
                    scrollTop()
                    $scope.$apply();
                });

                socket.on('disUser', (data) => {
                    console.log(data);
                    const messageData = {
                        type: {
                            code: 0, //server
                            message: 0 //disconnect
                        },
                        username: data.username
                    };

                    $scope.messages.push(messageData);
                    delete $scope.players[data.id];
                    scrollTop()
                    $scope.$apply();
                });

                socket.on('animate', data => {
                    console.log(data);
                    $('#' + data.socketId).animate({ 'left': data.x, 'top': data.y }, () => {
                        animate = false;
                    });
                });

                socket.on('newMessage', message => {
                    $scope.messages.push(message);
                    $scope.$apply();
                    showBubble(message.socketId, message.text)
                    scrollTop();
                });

                let animate = false;
                $scope.onClickPlayer = ($event) => {
                    if (!animate) {
                        let x = $event.offsetX;
                        let y = $event.offsetY;

                        socket.emit('animate', { x, y });
                        animate = true;
                        $('#' + socket.id).animate({ 'left': $event.offsetX, 'top': $event.offsetY }, () => {
                            animate = false;
                        });
                    };
                };

                $scope.newMessage = () => {
                    let message = $scope.message;
                    console.log(message);

                    const messageData = {
                        type: {
                            code: 1, // server
                        },
                        username: username,
                        text: message
                    };

                    $scope.messages.push(messageData);
                    $scope.message = '';

                    socket.emit('newMessage', messageData);
                    showBubble(socket.id, message)
                    scrollTop();

                }
            }).catch((err) => {
                console.log(err)
            });
    }
}]);