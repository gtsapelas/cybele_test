    BuilderWorkbench = function(qd) {
        var that = this;

        Array.prototype.move = function (from, to) {
            this.splice(to, 0, this.splice(from, 1)[0]);
        };

        this.qd = qd;
        this.config = qd.config.classes;

        this.builder = {
            instances: [],
            selection: undefined,
            property_selection: undefined,

            has_filters: function (filters) {
                for (var i = 0; i < filters.length; i++) {
                    if (filters[i] != undefined) {
                        return true;
                    }
                }

                return false;
            },

            /*Add more height to the workbench if necessary*/
            reset_height: function (i) {
                var o = $("#builder_workspace");
                if (i.position().top > o.height() - i.height()) { //when reaching bottom, make sure to enlarge the workspace height
                    o.height(i.position().top + i.height() + 50);
                    $("#tree_toolbar_objects").height(o.height() - 20);
                    $("#builder-canvas").attr('height', o.height());
                    arrows.ctx.height = o.height();

                    arrows.draw();
                }
            },

            /* returns the document used by plugins to generate query text */
            getQueryDocument: function() {
                return new DocumentBuilder(that.qd).getDocument();
            },

            /* default reset function */
            reset: function() {
                that.query = that.qd.config.language.parser(this.getQueryDocument()).getQuery();

                that.is_editing = true;
                that.qd.editor.setValue(that.query);
                that.is_editing = false;
            },

            /* Get the name of an endpoint*/
            endpoint_to_name: function (endpoint) {
                return that.qd.datasetSelect.getDatasetFromId(endpoint).title
            },

            /*Adds an instance of a class*/
            add_instance: function (dt_name, uri, label, x, y, default_properties) {
                console.log('in add')
                var new_id = this.instances.length;
                $('.help-prompt').remove();
                var new_instance = $.parseHTML('<div id="class_instance_' + new_id + '" class="class-instance" data-n="' + new_id + '"style="left: ' + x + 'px; top: ' + y + 'px;"><div class="title"><h3>' + label + '</h3><span class="subquery-select empty"></span><button type="button" class="delete btn btn-danger btn-simple btn-xs" data-about="' + new_id + '"><i class="material-icons">close</i></button><span class="dataset">' + this.endpoint_to_name(dt_name) + '</span></div><div class="properties"><span class="loading">Loading properties...</span></div></div>');
                $("#builder_workspace").append(new_instance);
                $(new_instance).draggable({
                    cancel: '.subquery-select', handle: '.title', cursor: 'move', drag: function () {
                        that.builder.reset_height($(this));
                        that.qd.arrows.draw();
                    }
                });
                this.bring_to_front(new_instance);

                var instance_object = {id: new_id, uri: uri, dt_name: dt_name, selected_properties: [], label: label};
                this.instances.push(instance_object);

                $(new_instance).find(".properties").html('<div class="property-table"><div class="header-row"><div></div><span>Show</span><span>Property</span><span>Optional</span><span>Order by</span><span>Filters</span><span>Foreign</span></div></div>');
                $(new_instance).find(".properties").append('<div class="property-control"></div>');

                // set title popup as whole variable name might not fit
                $(new_instance).find('.title > h3').attr('title', label);

                //add property selector
                instance_object.property_select = new PropertySelect(that.qd, instance_object);

                var self = this;
                var inst = self.instances[new_id];

                // get number of class instances
                var valuesCountUrl = that.config.valuesCountSource.from
                    .replace('{{ datasetId }}', dt_name)
                    .replace('{{ variableId }}', uri);

                // make request for properties
                /* $.ajax({
                    url: valuesCountUrl,
                    type: "GET",
                    success: function (resp) {
                        $("#class_instance_" + new_id + " .title h3").append('<span class="n-of-instances">(' + resp.count.toLocaleString() + ')</span>');
                    }
                }); */

                //check if uri exists in defaults or should be added manually
                var has_URI = false;
                if (default_properties) {
                    for (var k = 0; k < default_properties.length; k++) {
                        if (typeof default_properties[k] == 'string') {
                            if (default_properties[k] == 'VALUE') {
                                has_URI = true;
                                break;
                            }
                        }
                        else if (default_properties[k].uri == 'VALUE') {
                            has_URI = true;
                            break;
                        }
                    }
                }

                if (!has_URI) {
                    self.add_property(new_id, 'VALUE', label); //add URI by default
                }

                if (default_properties) {
                    for (var k = 0; k < default_properties.length; k++) {  //for each saved property
                        if (typeof default_properties[k] == 'string') { //property uri as input
                            self.add_property(new_id, default_properties[k]);
                        } else { //property object as input
                            var pname = '';
                            if (default_properties[k].name_from_user) {
                                pname = that.qd.propertyOptions.propertyNameFromString(new_id, default_properties[k].uri, default_properties[k].name);
                            } else {
                                pname = default_properties[k].label
                            }
                            self.add_property(new_id, default_properties[k].uri, pname);

                            // inst.selected_properties[k] = jQuery.extend(true, {}, default_properties[k]); //clone the property object
                            var sel = "#class_instance_" + new_id + " .property-row:nth-of-type(" + (k + 2) + ") ";
                            if (!inst.selected_properties[k].show) { //show
                                $(sel + "span:nth-of-type(1) input").prop('checked', false)
                            }
                            if (inst.selected_properties[k].optional) { //optional
                                $(sel + "span:nth-of-type(3) input").prop('checked', true)
                            }
                            if (inst.selected_properties[k].orderBy) { //order by
                                $(sel + "span:nth-of-type(4) select").val(inst.selected_properties[k].orderBy);
                            }

                            if (that.builder.has_filters(inst.selected_properties[k].filters)) { //add the filters tick
                                $(sel + "span:nth-of-type(5)").html('<span class="ui-icon ui-icon-check"></span>Edit');
                            }
                        }
                    }
                }

                $(".property-table").sortable({ //make properties sortable
                    items: ".property-row",
                    stop: self.update_orders
                });

                that.builder.reset_height($("#class_instance_" + new_id));
                that.builder.reset();
                that.qd.arrows.draw();

                setTimeout(function() {
                    that.qd.queryExecutor.run();
                }, 100);
            },

            update_orders: function (e, ui) { //update properties, arrows & query after property reordering
                var i = $(ui.item[0]).data('i');
                var old_n = $(ui.item[0]).data('n');
                var new_n = $(ui.item[0]).index() - 1;

                //reorder in property selection
                that.builder.instances[i].selected_properties[old_n].n = new_n;
                that.builder.instances[i].selected_properties[new_n].n = old_n;
                that.builder.instances[i].selected_properties.move(old_n, new_n);

                //reorder property in arrows
                arrows.reorder_property("#class_instance_" + i, old_n, new_n);

                //change data attributes
                var table_rows = $("#class_instance_" + i + " .property-table .property-row");
                for (var j = 0; j < table_rows.length; j++) { //update properties' <n> data
                    var p_row = $(table_rows[j]);
                    var p_n = p_row.data('n');
                    if ((p_n >= new_n) && (p_n < old_n)) {
                        p_row.data('n', p_n + 1);
                        p_row.attr('data-n', p_n + 1);
                    }
                    else if ((p_n <= new_n) && (p_n > old_n)) {
                        p_row.data('n', p_n - 1);
                        p_row.attr('data-n', p_n - 1);
                    }
                    else if (p_n == old_n) {
                        p_row.data('n', new_n);
                        p_row.attr('data-n', new_n);
                    }
                }

                //update options variable order
                if (old_n < new_n) {
                    that.builder.options.reorder('?' + that.builder.instances[i].selected_properties[new_n].name, '?' + that.builder.instances[i].selected_properties[new_n - 1].name, true);
                } else {
                    that.builder.options.reorder('?' + that.builder.instances[i].selected_properties[new_n].name, '?' + that.builder.instances[i].selected_properties[new_n + 1].name, false);
                }

                //update the query
                that.builder.reset();
            },

            get_uri_position: function (instance) {
                if (!isNaN(Number(instance))) { //by instance id
                    var inst = this.instances[instance];
                } else { //by instance selector
                    var inst = this.instances[$(instance).data('n')];
                }

                for (var i = 0; i < inst.selected_properties.length; i++) {
                    if (inst.selected_properties[i].uri == "URI") {
                        return i;
                    }
                }

                return -1;
            },

            bring_to_front: function (obj) {
                var mx = 0;
                for (var i = 0; i < $('.class-instance').length; i++) {
                    var zIndex = parseInt($($('.class-instance')[i]).css('z-index'));
                    if (mx < zIndex) {
                        mx = zIndex;
                    }
                }

                $(obj).css("z-index", mx + 1);
            },

            add_property: function (num, _id, label, info) {
                //load custom name
                if (label === undefined) {
                    if (_id == "VALUE") {
                        label = "Value";
                    }
                }

                var instance = this.instances[num];
                var pObject = {
                    uri: _id,
                    label: label,
                    n: instance.selected_properties.length,
                    optional: false,
                    show: true,
                    orderBy: undefined,
                    filters: [],
                    info: info
                };
                instance.selected_properties.push(pObject);

                var optional_disabled = "";
                if (pObject.uri == "URI") { //URI can not be optional
                    optional_disabled = 'disabled = "disabled"';
                }

                var data_i_n = 'data-i="' + num + '" data-n="' + pObject.n + '"';
                if (pObject.uri == "VALUE") {
                    var delete_property = '<div></div>';
                } else {
                    var delete_property = '<div class="delete-property">x</div>';
                }

                // title is Label followed by type, if available
                var property_object_str = '<div class="property-row" ' + data_i_n + '>' + delete_property + '<span class="property-show"><input type="checkbox" checked="checked"/></span><span>';
                var order_select = '<select><option value=""></option><option value="ASC">ASC</option><option value="DESC">DESC</option></select>';
                property_object_str += label + '</span><span class="property-optional"><input  type="checkbox" ' + optional_disabled + ' /></span><span class="property-order-by">' + order_select + '</span><span>Edit</span><span>+Add</span></div>';
                var property_object = $.parseHTML(property_object_str);

                var id = "#class_instance_" + num;
                $(id + " .property-table").append(property_object);

                that.builder.reset_height($(id));
                that.builder.reset();
            },

            fromJson: function (data) { //re-construct a query design from a json object
                for (var i = 0; i < data.instances.length; i++) { //foreach instance
                    var inst = data.instances[i];

                    var endpoint = inst.dt_name;

                    // reset instance reference
                    $.each(inst.selected_properties, function(idx, sp) {
                        sp.instance = inst;
                    });

                    this.add_instance(endpoint, inst.uri, inst.label, inst.position.x, inst.position.y, inst.selected_properties);
                    // sub_Q.set_subquery(i, data.instances[i].subquery);
                }

                that.qd.arrows.connections = data.connections; //restore the connections
                that.qd.arrows.paths = data.paths; //restore connection paths

                that.builder.options = that.builder.options || {};
                that.builder.options.pattern = data.pattern;
                if (typeof(that.builder.options.pattern) == "undefined") {
                    that.builder.options.pattern = "";
                }
                that.builder.options.distinct = data.distinct;
                that.builder.options.limit = data.limit;
                that.builder.options.offset = data.offset;
                that.builder.options.variables = data.variables;

                that.qd.arrows.draw();
                that.builder.reset();
            },

            toJson: function () { //export the design to a json object
                that.builder.options = that.builder.options || {};

                var data = {
                    instances: [],
                    connections: that.qd.arrows.connections,
                    paths: that.qd.arrows.paths,
                    pattern: that.builder.options.pattern,
                    distinct: that.builder.options.distinct,
                    limit: that.builder.options.limit,
                    offset: that.builder.options.offset,
                    variables: that.builder.options.variables
                };

                for (var i = 0; i < this.instances.length; i++) { //foreach instance
                    data.instances[i] = {
                        uri: this.instances[i].uri,
                        dt_name: this.instances[i].dt_name,
                        position: {
                            x: $("#class_instance_" + i).offset().left - $("#builder_workspace").offset().left,
                            y: $("#class_instance_" + i).offset().top - $("#builder_workspace").offset().top,
                        },
                        label: this.instances[i].label,
                        selected_properties: this.instances[i].selected_properties,
                        subquery: this.instances[i].subquery
                    };

                    // remove instance ref from selected_properties
                    $.each(data.instances[i].selected_properties, function(idx, sp) {
                        sp.instance = null;
                    });
                }

                return data;
            }
        };

        /*Bring clicked instance front*/
        $("body").on('mousedown', '.class-instance', function (e) {
            that.builder.bring_to_front(this);
        });


        /*Delete instances*/
        $("body").on('click', '.class-instance .delete', function () {
            var n = $(this).data("about");
            var id = "#class_instance_" + n;

            $(id).remove(); //delete the instance container

            arrows.remove_instance(id); //remove arrows from and to this instance

            that.builder.instances[n].property_select.stop();

            //rearrange remaining instances after the deleted
            for (var i = n + 1; i < that.builder.instances.length; i++) {
                //update the object's id
                that.builder.instances[i].id = i - 1;

                //update the instance (meta) data
                $("#class_instance_" + i).data('n', (i - 1));
                $("#class_instance_" + i).attr('data-n', (i - 1));

                //update the x button
                $("#class_instance_" + i + " .delete").data('about', (i - 1));
                $("#class_instance_" + i + " .delete").attr('data-about', (i - 1));

                //update the add property button
                $("#class_instance_" + i + " .add-property").data('about', (i - 1));
                $("#class_instance_" + i + " .add-property").attr('data-about', (i - 1));

                //update each property row
                $("#class_instance_" + i + " .property-row").data('i', (i - 1));
                $("#class_instance_" + i + " .property-row").attr('data-i', (i - 1));

                //change id
                $("#class_instance_" + i).attr('id', "class_instance_" + (i - 1));

                //update connections
                arrows.rename_instance("#class_instance_" + i, "#class_instance_" + (i - 1));

                //update sub-queries
                sub_Q.rename_instance(i, i - 1);
            }

            that.builder.instances.splice(n, 1); //also delete from instance array
            that.builder.reset();
        });

        /*Delete properties*/
        $("body").on('click', '.class-instance .delete-property', function () {
            var i = $(this).parent().data("i");
            var n = $(this).parent().data("n");

            for (var j = 0; j < $(this).parent().siblings().length; j++) { //update next properties' <n> data
                var nx = $(this).parent().siblings()[j];
                if ($(nx).data('n') > n) {
                    var new_n = $(nx).data('n') - 1;
                    $(nx).data('n', new_n);
                    $(nx).attr('data-n', new_n);
                }
            }

            $(this).parent().remove(); //remove the row

            that.qd.arrows.remove_property('#class_instance_' + i, n); //remove arrows from and to this property
            that.builder.instances[i].selected_properties.splice(n, 1); //also delete from selected properties array

            that.builder.reset();
        });

        /*Order by*/
        $("body").on('change', '.property-row span:nth-of-type(4) select', function (e) {
            that.builder.instances[$(this).parent().parent().data('i')].selected_properties[$(this).parent().parent().data('n')].orderBy = $(this).val();
            that.builder.reset();
        });

        /*Adding filter*/
        $("body").on('click', '.property-row span:nth-of-type(5)', function (e) {
            that.builder.property_selection = that.builder.instances[$(this).parent().data('i')].selected_properties[$(this).parent().data('n')];
            that.builder.property_selection_of_instance = $(this).parent().data('i');
            that.qd.filters.show();
        });

        /*Adding foreign keys*/
        $("body").on('click', '.property-row span:nth-of-type(6)', function (e) {
            if (that.builder.connection_from) { //already set
                return;
            }

            var style = "";
            if ($(this).prev().prev().prev().find('input').is(':checked')) {
                var style = "dashed";
            }

            that.builder.connection_from = {
                i: $(this).parent().data('i'),
                n: $(this).parent().data('n'),
                style: style
            };

            e.preventDefault();
            e.stopPropagation();
        });

        $("#builder_workspace").on('click', function (e) {
            if (e.which != 1) { //not left click
                that.builder.connection_from = undefined;
            }
        });

        /*Add arrow on mouse enter*/
        $("body").on('mouseenter', '.property-row', function () {
            var c = that.builder.connection_from;
            if (c != undefined) {
                if ($(this).data('i') == c.i) return;
                arrows.add_arrow('#class_instance_' + c.i, c.n, '#class_instance_' + $(this).data('i'), $(this).data('n'), c.style);
            }
        });

        /*Add arrow on class header mouse enter*/
        $("body").on('mouseenter', '.class-instance .title', function () {
            var c = that.builder.connection_from;
            if (c != undefined) {
                var i = $(this).parent().data('n');
                var n = that.builder.get_uri_position(i); //uri
                if (i == c.i) return;

                $(this).addClass('connecting');
                arrows.add_arrow('#class_instance_' + c.i, c.n, '#class_instance_' + i, n, c.style);
            }
        });

        /*Remove arrow on leave*/
        $("body").on('mouseleave', '.property-row', function () {
            var c = that.builder.connection_from;
            if (c != undefined) {
                if ($(this).data('i') == c.i) return;
                arrows.remove_arrow('#class_instance_' + c.i, c.n, '#class_instance_' + $(this).data('i'), $(this).data('n'));
            }
        });

        /*Remove arrow on class header mouse enter*/
        $("body").on('mouseleave', '.class-instance .title', function () {
            var c = that.builder.connection_from;
            if (c != undefined) {
                var i = $(this).parent().data('n');
                var n = that.builder.get_uri_position(i); //uri
                if (i == c.i) return;

                $(this).removeClass('connecting');
                arrows.remove_arrow('#class_instance_' + c.i, c.n, '#class_instance_' + i, n);
            }
        });

        /*Make arrow permanent*/
        $("body").on('click', '.property-row, .class-instance .title', function (e) {
            if ((e.which == 1) && (that.builder.connection_from)) {
                $(this).removeClass('connecting');

                that.builder.connection_from = undefined;
                that.builder.reset();

                e.preventDefault();
                e.stopPropagation();
            }
        });

        /*Make and unmake property optional*/
        $("body").on('change', '.property-row .property-optional input', function (e) {
            var i = $(this).parent().parent().data('i');
            var n = $(this).parent().parent().data('n');

            that.builder.instances[i].selected_properties[n].optional = $(this).is(':checked');
            var style = "";
            if (that.builder.instances[i].selected_properties[n].optional) {
                style = "dashed";
            }

            that.qd.arrows.set_style('#class_instance_' + i, n, style);
            that.builder.reset();
        });

        /*Show or not a property in the results*/
        $("body").on('change', '.property-row .property-show input', function (e) {
            var i = $(this).parent().parent().data('i');
            var n = $(this).parent().parent().data('n');

            //set value & propagate to foreign keys
            that.builder.instances[i].selected_properties[n].show = $(this).is(':checked');
            propagate_shown_property(i, n, $(this).is(':checked'));

            that.builder.reset();
        });

        //search for connected properties & change their show to
        function propagate_shown_property(i, n, val) {
            for (var c = 0; c < arrows.connections.length; c++) {
                var fi = arrows.connections[c].f.split('_').pop();
                var ti = arrows.connections[c].t.split('_').pop();

                if ((fi == i) && (arrows.connections[c].fp == n)) {
                    //if already set no need to continue
                    if (that.builder.instances[ti].selected_properties[arrows.connections[c].tp].show == that.builder.instances[i].selected_properties[n].show) {
                        return;
                    }

                    $(arrows.connections[c].t + " .property-row:nth-of-type(" + (arrows.connections[c].tp + 2) + ") span:nth-of-type(1) input").prop('checked', val);
                    that.builder.instances[ti].selected_properties[arrows.connections[c].tp].show = val;

                    propagate_shown_property(ti, arrows.connections[c].tp);
                }
                else if ((ti == i) && (arrows.connections[c].tp == n)) {
                    //if already set no need to continue
                    if (that.builder.instances[fi].selected_properties[arrows.connections[c].fp].show == that.builder.instances[i].selected_properties[n].show) {
                        return;
                    }

                    $(arrows.connections[c].f + " .property-row:nth-of-type(" + (arrows.connections[c].fp + 2) + ") span:nth-of-type(1) input").prop('checked', val);
                    that.builder.instances[fi].selected_properties[arrows.connections[c].fp].show = val;

                    propagate_shown_property(fi, arrows.connections[c].fp);
                }
            }
        }

        $.contextMenu({
            selector: '.property-table .property-row',
            callback: function (key, options) {
                var id = options.$trigger.attr('id');

                if (key == "Options") {
                    that.qd.propertyOptions.show($(options.$trigger).data('i'), $(options.$trigger).data('n'));
                }
                else if (key == "Move up") {
                    var prev = $(options.$trigger).prev();

                    if ($(prev).hasClass("property-row")) {
                        $(options.$trigger).insertBefore($(prev));
                        that.builder.update_orders(null, {item: $(options.$trigger)});
                    }
                }
                else if (key == "Move down") {
                    var next = $(options.$trigger).next();

                    if ($(next).hasClass("property-row")) {
                        $(next).insertBefore($(options.$trigger));
                        that.builder.update_orders(null, {item: $(options.$trigger)});
                    }
                }
                else if (key == "Delete") {
                    $(options.$trigger).find('.delete-property').click();
                }
            },
            items: {
                "Options": {name: "Options", icon: "edit"},
                "sep1": "---------",
                "Move up": {name: "Move up", icon: "move-up"},
                "Move down": {name: "Move down", icon: "move-down"},
                "sep2": "---------",
                "Delete": {name: "Delete", icon: "delete"},
            }
        });

        /* Warn on page unload */
        window.addEventListener("beforeunload", function (e) {
            if (builder.query != builder.saved_query) {
                var confirmationMessage = 'There are changes in the Query Designer that have not been saved.';

                (e || window.event).returnValue = confirmationMessage; //Gecko + IE
                return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
            }
        });

        /* Drag & Dropping */
        $("#builder_workspace").mouseup(function(e) {
            if ((e.which == 1) && that.builder.selection) { //only for left click and when a class selection has been made
                that.builder.add_instance(that.builder.selection.dt_name, that.builder.selection.uri, that.builder.selection.label, e.pageX - $(this).position().left, e.pageY - $(this).position().top);

                that.builder.selection = undefined;
                $(this).removeClass("accepting-instance");
                $(".toolbar, #tree_toolbar").removeClass("accepting-instance");
            }
        });

        return this;
    };



