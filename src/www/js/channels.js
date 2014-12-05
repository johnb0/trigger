function fillchannelsdata(d) {
    var sorting = function(a, b) {
        if (a.lst) {
            var dif = b.lst - a.lst;
            if (dif != 0) {
                return dif;
            } else {
                return a.id - b.id;
            }
        } else {
            return a.id - b.id;
        }
    }


    var showElection = function(election, cd) {
        election.html('');
        var message = ''
        if (cd.your) {
            message = '<div class="greating">Ты как раз вовремя, ' + client.user.n + '! <br>Твой кандидат - <a href="javascript:getuser('+cd.your.id+');void(0);">'+cd.your.name+'</a><br></div>';

        } else {
            message = '<div class="greating">Ты как раз вовремя, ' + client.user.n + '! <br>Исполни свой гражданский долг - введи в поле ниже id своего избранника.<br></div>';
        }
        $(message).appendTo(election);
        var voteinput = $('<input class="prid" type="text" placeholder="id кандидата">').appendTo(election);
        var summary = $('<div class="electionlist">Сейчас расстановка сил такая:</div>').appendTo(election);
        console.log(cd);
        var elstr = '';
        for (var i in cd.candidates) {
            var can = cd.candidates[i];
            elstr += '<li><a class="candidate-name" href="javascript:getuser(' + can.id + ');void(0);">' + can.name + '</a> &mdash; <span class="descr">' + can.votes + '</span>'
        }
        $(elstr).appendTo(summary);

        voteinput.bind("keyup", function(event) {
            if (event.keyCode == 13) {
                var prvote = $.trim(voteinput.val()).replace('↵', '');
                if (prvote.length) {
                    client.sendPRVote({chid: cd.id, prid: prvote}, function(data) {
                        if (data.error) {
                        } else {
                            data.id=cd.id;
                            showElection(election, data);
                        }
                    })
                }
            }
        });


    }

    var fillbanlist = function(blist, banned) {
        $(blist).html('');
        var chid = blist.attr('id');
        var bancontrol = false;

        if (client.user.prch || client.user.opch) {
            if (client.user.prch == chid || client.user.opch == chid) {
                bancontrol = true;
            }
        }
        for (var b in banned) {
            var bu = banned[b];
            var bstr = '<li><a class="banned-name" href="javascript:getuser(' + bu.id + ');void(0);">' + bu.name + '</a> &mdash; <span class="descr">' + bu.reason + '</span>';
            if (bancontrol) {
                bstr += '<a href="javascript:void(0);" id="' + bu.id + '" class="delete"></a>';
            }
            bstr += '</li>';
            var bnode = $(bstr).appendTo(blist);
            $(bnode).children('.delete').click(function(event) {
                var bl = event.target.parentNode.parentNode;
                client.unbanuser(event.target.id, function(cd) {
                    console.log(cd);
                    if (cd.banned) {
                        fillbanlist($(bl), cd.banned);
                    }
                });
            });
        }
    }
    var filleditorslist = function(elist, editors) {
        $(elist).html('');
        var editorscontrol = false;
        var chid = elist.attr('id');
        if (client.user.prch) {
            if (client.user.prch == cd.id) {
                editorscontrol = true;
            }
        }
        for (var e in editors) {
            var ed = editors[e];
            var estr = '<li><a class="editor-name" href="javascript:getuser(' + ed.id + ');void(0);">' + ed.name + '</a> &mdash; <span class="descr">' + ed.post + '</span>';
            if (editorscontrol) {
                estr += '<a href="javascript:void(0);" class="delete" id="' + ed.id + '"></a>';
            }
            estr += '</li>';
            var enode = $(estr).appendTo(elist);
            $(enode).children('.delete').click(function(event) {
                console.log(event);
                var bl = event.target.parentNode.parentNode;
                console.log(bl.id);
                client.removeop({id: event.target.id, chid: bl.id}, function(cd) {
                    console.log(cd);
                    if (cd.editors) {
                        filleditorslist($(bl), cd.editors);
                    }
                });
            });
        }
    }

    $('#info .content.channels .list').html('');
    $('#info .content.channels').show();
    if (d.channels.length > 0) {
        if (d.channels[0].lst) {
            d.channels.sort(sorting);
        }
        for (var c in d.channels) {
            var cd = d.channels[c];
            var chdd = $('<li class="channel"></li>').appendTo($('#info .content.channels .list'));
            //var channeldom = '<div class="base"><a href="javascript: client.goChannel(' + cd.id + ', onChannel);void(0);" class="name">' + cd.name + '</a><a href="' + streampath + cd.hi;
            // channeldom += '" target="_blank">192kbps</a> <a href="' + streampath + cd.low;
            //channeldom += '" target="_blank">96kbps</a><div class="listners"><span>Слушают:</span>' + cd.lst + '</div><br /></div>';
            var channeldom = '<div class="base"></div>';
            var chd = $(channeldom).appendTo(chdd);
            // $('<div class="hint"><<<клик</div>').appendTo(chd);
            var description = $('<div class="description">' + cd.description + '</div>').appendTo(chd);
            var reader = setTimeout(function() {
                storageinfo = $.Storage.get("channel" + cd.id);
                if (storageinfo != cd.description) {
                    console.log('info changed');
                    $('#info .tab .channels a').html('Демократия (!)');
                }
                if ($('#info .content.channels').is(':visible')) {
                    $.Storage.set("channel" + cd.id, cd.description);
                    $('#info .tab .channels a').html('Демократия');
                }
            }, 3000);
            if (client.user) {
                if (client.user.prch) {
                    if (client.user.prch == cd.id) {
                        description.attr('contentEditable', true);
                        var editor = $('<div class="htmleditor" contenteditable="true"></div>').appendTo(chd);
                        editor.keyup(function() {
                            description.html(editor.text());
                        });
                        description.keyup(function() {
                            editor.text(description.html());
                        });
                        editor.text(cd.description);
                        var contents = editor.text();
                        description.blur(function() {
                            editor.text(description.html());
                            if (contents != editor.text()) {
                                var newdescr = editor.text();
                                client.setprops({description: newdescr}, function(serverdata) {
                                    console.log(serverdata);
                                });
                                contents = editor.text();
                            }
                        });
                    }
                }
            }
            //   if (cd.current) {
            // var current = $('<div class="current"><div class="cap">Сейчас:</div><div class="artist">' + cd.current.a + '</div><div class="title">' + cd.current.t + '</div><span><a href="http://vk.com/audio?q=' + encodeURIComponent(cd.current.a) + ' - ' + encodeURIComponent(cd.current.t) + '" target="_blank">>vk</a></span></div>').appendTo(chd);
            // var current = $('<div class="current"><div class="cap">Сейчас:</div><div class="artist">' + cd.current.a + '</div><div class="title">' + cd.current.t + '</div></div>').appendTo(chd);
            //   }

            var users = $('<div class="users"><div class="usershead">Прямо сейчас эфир делают:</div></div>').appendTo(chd);
            for (var u in cd.users) {
                var instring = '<span><a href="javascript:getuser(' + cd.users[u].id + ');void(0);">' + cd.users[u].n + '</a> </span>'
                $(instring).appendTo(chd);
            }

            if (client.user) {
                var full = $('<section class="full clearfix" />').appendTo(chdd);
                if (cd.election) {
                    var election = $('<section class="electionblock" />').appendTo(full);
                    cd.election.id=cd.id;
                    showElection(election, cd.election);
                }
                var l_roll = $('<div class="l-col"/>').appendTo(full);
                var r_roll = $('<div class="r-col"/>').appendTo(full);

                var prman = '<div class="prman"><header>Продюсер:</header>';
                prman += '<a class="prman-crown" href="javascript:getuser(' + cd.prid + ');void(0);">' + cd.prname + '</a></div>';// &mdash; <span class="descr">Продюссер</span>';
                $(prman).appendTo(l_roll);
                //<a href="" class="delete"></a></div>'
                var edir = $('<div class="editors"/>').appendTo(l_roll);


                var addstr = '<header>Редакционная коллегия:</header>';
                if (client.user) {
                    if (client.user.prch) {
                        if (client.user.prch == cd.id) {
                            addstr += '<label><input class="id" type="text" placeholder="ID"><input class="editorpost" type="text" placeholder="Редактор">';
                            addstr += '<button id="' + cd.id + '">Ok</button></label>';
                        }
                    }
                }
                var adder = $(addstr).appendTo(edir);
                var elist = $('<ul class="editors-list" id="' + cd.id + '"></ul>').appendTo(edir);
                $(adder).children('button').click(function(e) {
                    var edid = $(e.target.parentNode).find('input.id').val();
                    var edpost = $(e.target.parentNode).find('input.editorpost').val();
                    client.setop({id: edid, post: edpost, chid: e.target.id}, function(cd) {
                        if (cd.editors) {
                            filleditorslist($(e.target.parentNode.parentNode).find('.editors-list'), cd.editors);
                        }
                    });

                });
                if (cd.editors) {
                    filleditorslist(elist, cd.editors);
                }

                if (cd.banned || (client.user.prch == cd.id || client.user.opch == cd.id)) {
                    var bn = $('<div class="banned" />').appendTo(r_roll);
                    $('<header>Жертвы репрессий:</header>').appendTo(bn);

                    if (client.user.prch == cd.id || client.user.opch == cd.id) {
                        if (client.user.prch == cd.id || client.user.opch == cd.id) {
                            var addbanstr = '<label><input class="id" type="text" placeholder="ID">';
                            addbanstr += '<input type="text" class="reason" placeholder="Причина бана"><button>Ok</button></label></div>';
                        }

                    }
                    var bader = $(addbanstr).appendTo(bn);
                    var blist = $('<ul class="banned-list" id="' + cd.id + '"></ul>').appendTo(bn);
                    bader.children('button').click(function(e) {
                        var id = $(e.target.parentNode).find('input.id').val();
                        var reason = $(e.target.parentNode).find('input.reason').val();
                        client.banuser(id, reason, function(data) {
                            if (data.banned) {
                                fillbanlist($(e.target.parentNode.parentNode).find('.banned-list'), data.banned);
                            }
                        })
                    })


                    if (cd.banned.length) {
                        fillbanlist(blist, cd.banned);
                    }
                }
            }


            //   }
            /*            chd.click(function() {
             var chf = $(this.parentNode).children('.full');
             if (!$(chf).hasClass('active')) {
             $('#info .content.channels .full').hide(400).removeClass('active');
             $(chf).show(400).addClass('active');
             }
             });}*/
        }
        // $('#info .content.channels .full').hide();
    }
}
function showChannels(gdata) {
    if ($('#info .content.channels').css('display') == 'none' || gdata) {
        $('#info .tabs .channels').trigger('click');
        if (gdata) {
            fillchannelsdata(gdata);
        } else {
            client.getChannels(fillchannelsdata);
        }
    }
}