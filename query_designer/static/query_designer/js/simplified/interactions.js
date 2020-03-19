$(function() {
    var display_tour = true;
    var first_tour = new Tour({
        template: "<div class='popover tour' style='min-width: 350px; min-height: 120px; color: black;'>" +
            "<div class='arrow'></div>" +
            "<h3 class='popover-title' style='box-shadow: 0px 1px #bfbfbf;'></h3>" +
            "<div class='popover-content'></div>" +
            "<div class='popover-navigation'>" +
            "<button class='btn btn-sm btn-primary' data-role='prev'>« Prev</button>" +
            "<span data-role='separator'>|</span>" +
            "<button class='btn btn-sm btn-primary' data-role='next'>Next »</button>" +
            "<button class='btn btn-sm btn-primary pull-right' data-role='end'>End tour</button>" +
            "</div>" +
            "</div>",
    });

    first_tour.addStep({
        element: "#chart-sidebar .nav li:nth-child(1)",
        placement: "bottom",
        title: "Variable",
        // duration: 3500,
        content: "See the variables included in your query, add aggregate functions or delete them.",
    });
    first_tour.addStep({
        element: "#chart-sidebar .nav li:nth-child(2)",
        placement: "bottom",
        title: "Filters",
        // duration: 3500,
        content: "Narrow your query results by applying filters on space, time and the rest of the fields.",
    });
    first_tour.addStep({
        element: "#chart-sidebar .nav li:nth-child(3)",
        placement: "bottom",
        title: "Operations",
        // duration: 3500,
        content: "Create groups, apply orderings or choose spatial and temporal resolutions.",
    });
    first_tour.addStep({
        element: "#run-query-btn",
        placement: "left",
        title: "Run Query",
        // duration: 3500,
        content: "Run your query and get the results!",
    });
    first_tour.addStep({
        element: ".add-value-field",
        placement: "left",
        title: "Select Data",
        // duration: 3500,
        content: "Select data to be added to your query.",
    });


    // *** DATA SELECTION MODAL *** //

    /* Close the data selection modal on cancel*/
    $('#selection-close-btn').on('click', function () {
        $('#select-data-modal').dialog('close');
    });


    function onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
    }

    function update_datasets_and_common_dimensions() {
        var all_dimensions = [], common_dimensions = [];
        var all_datasets = [];
        var all_dataset_names = [];
        $.each(QueryToolbox.variables, function (_, v_obj) {
            $.each(v_obj.dimensions, function (_, d_obj) {
                 all_dimensions.push(d_obj.name);
            });
            all_datasets.push(v_obj.dataset_id);
            all_dataset_names.push(v_obj.dataset_name.trim());
        });
        QueryToolbox.datasets = all_datasets.filter( onlyUnique );
        QueryToolbox.dataset_names = all_dataset_names.filter( onlyUnique );

        all_dimensions = all_dimensions.filter( onlyUnique );
        common_dimensions = all_dimensions;
        $.each(QueryToolbox.variables, function (_, v_obj) {
            var var_dims = [];
            $.each(v_obj.dimensions, function (_, d_obj) {
                var_dims.push(d_obj.name);
            });
            common_dimensions  = common_dimensions.filter(value => var_dims.includes(value));
        });
        // console.log("common dimensions");
        // console.log(common_dimensions);
        QueryToolbox.common_dimensions = common_dimensions;
        return common_dimensions;
    }


    /* Add a variable from the data selection modal */
    $('#selection-confirm-btn').on('click', function() {
        // The new variable to be added for query
        var selection = window.getDataSelection();
        console.log(selection);
        add_selection(selection);
    });

    window.add_selection = function (selection) {
        var included_vars = [];
        var first_var = selection[0].dataset_id;
        console.log('new dataset_id '+first_var);
        var joined_flag = false;
        for (var i=0; i<QueryToolbox.variables.length; i++) {
            console.log('is '+ QueryToolbox.variables[i].dataset_id+ ' the same with '+ first_var + '?');
            if (first_var !== QueryToolbox.variables[i].dataset_id) {
                joined_flag = true;
                console.log('Joined Datasets');
            }
        }

        $.each(QueryToolbox.variables, function (_, variable) {
            included_vars.push(parseInt(variable.id));
        });
        $.each(selection, function (_, newVariable) {
            if(included_vars.indexOf(newVariable.id) < 0){
                // Get the area of the Query Desinger where the new variable field will be added
                var $chartControls = $('#chart-control-list  .chart-control');
                // Add the label
                var label = 'Metric #<span class="metric-cnt">' + (QueryToolbox.variables.length + 1) + '</span> <span style="font-size: 9pt;">(from ' + newVariable.dataset_name + ')</span>';
                var obj = QueryToolbox.objects[0];

                // The new variable field
                var $fieldset = QueryToolbox.addVariableField({
                    choices: obj.chartPolicy.variables,
                    label: label,
                    name: newVariable.name,
                    title: newVariable.title,
                    id: newVariable.id,
                    datatype: newVariable.datatype,
                    unit: newVariable.unit,
                    dimensions: newVariable.dimensions,
                    canDelete: true,
                    dataset_id: newVariable.dataset_id,
                    dataset_name: newVariable.dataset_name
                });

                // Select2 for the aggregation function
                $fieldset.find('select').select2();
                // add the new variable field
                $chartControls.append($fieldset);
                // show other query controls if at least one variable is selected
                if ($chartControls.find('> *').length > 0) {
                    $('.after-data-selection').each(function () {
                        $(this).show();
                    });
                    $('.before-data-selection').each(function () {
                        $(this).hide();
                    });
                }

                QueryToolbox.variables.push({
                    id: newVariable.id,
                    name: newVariable.name,
                    title: newVariable.title,
                    unit: newVariable.unit,
                    datatype: newVariable.datatype,
                    aggregate: $fieldset.find('.col-prefix').find("select").val(),
                    dimensions: newVariable.dimensions,
                    dataset_id: newVariable.dataset_id,
                    dataset_name: newVariable.dataset_name,
                    dataset_size: newVariable.dataset_size,
                    dataset_lat_min: newVariable.dataset_lat_min,
                    dataset_lat_max: newVariable.dataset_lat_max,
                    dataset_lon_min: newVariable.dataset_lon_min,
                    dataset_lon_max: newVariable.dataset_lon_max,
                    dataset_time_min: newVariable.dataset_time_min,
                    dataset_time_max: newVariable.dataset_time_max
                });
            }
        });


        var common_dimensions = update_datasets_and_common_dimensions();


        var hasGlobal = false;
        var hasDanish = false;
        $.each(QueryToolbox.dataset_names, function (idx, dataset) {
           if(dataset.toLowerCase().indexOf("global") >= 0){
               hasGlobal = true;
           }
           if(dataset.toLowerCase().indexOf("danish") >= 0){
               hasDanish = true;
           }
        });

        var magnitude = '';
        $.each(QueryToolbox.variables, function (_, v_obj) {
            if(v_obj.dataset_size.indexOf("billion") > 0){
                magnitude = "billion";
            }
        });


        if(hasGlobal){
            console.log('has global');
            $("#mapchoices").val(1).trigger("change");


            // var start = new Date(parseInt(selection[0].dataset_time_min));
            // var end  = new Date(parseInt(selection[0].dataset_time_min) + 3600000);
            //
            // var startpick = $('#startdatepicker').datetimepicker({
            //     autoclose: true,
            //     pickerPosition: 'top-left',
            // });
            // $('#startdatepicker').datetimepicker("update", start);
            // console.log('start date');
            // startdate = $('#startdatepicker input').val();
            //
            // var endpick = $('#enddatepicker').datetimepicker({
            //     autoclose: true,
            //     pickerosition: 'top-left',
            // });
            // $('#enddatepicker').datetimepicker("update", end);
            // enddate = $('#enddatepicker input').val();
            // console.log('end date');
        }


        $("#joined_dimensions_div").html("").addClass("hidden");
        if (joined_flag){
            $("#joined_dimensions_div").removeClass("hidden");
            $("#joined_dimensions_div").append("<p style='margin: 0;'>Datasets joined on their common fields:</p>");
            for (var i=0; i<common_dimensions.length; i++) {
                if(i === common_dimensions.length-1){
                    $("#joined_dimensions_div").append("<span>"+common_dimensions[i]+"</span>");
                }
                else{
                    $("#joined_dimensions_div").append("<span>"+common_dimensions[i]+", </span>");
                }
            }

            //automatically fill spatial and temporal resolution when joining datasets
            // if(( $('#temporal_resolution').val()==='') && (common_dimensions.indexOf("time") >= 0) ){
            //     $('#temporal_resolution').val('hour');
            //     $('#temporal_resolution').trigger('change');
            // }
            // if(( $('#spatial_resolution').val()==='') && ((common_dimensions.indexOf("latitude") >= 0) || (common_dimensions.indexOf("longitude") >= 0) )){
            //     $('#spatial_resolution').val('0.1');
            //     $('#spatial_resolution').trigger('change');
            // }
            $('#temporal_resolution').val('hour');
            $('#temporal_resolution').trigger('change');
            $('#spatial_resolution').val('0.1');
            $('#spatial_resolution').trigger('change');


            if($('#spatial_resolution').val() !== "")
                $("#joined_dimensions_div").append("<p id='harmonised_space' style='margin: 0;'>Harmonised on space: " + $('#spatial_resolution').val() + "deg</p>");
            if($('#temporal_resolution').val() !== "")
                $("#joined_dimensions_div").append("<p id='harmonised_time' style='margin: 0;'>Harmonised on time: " + $('#temporal_resolution').val() +"</p>");

        }

        $("#join_warning_div").addClass("hidden");
        if(QueryToolbox.datasets.length > 2){
            $("#join_warning_div").removeClass("hidden");
        }

        // console.log(QueryToolbox.variables);

        // Update all the Query Designer fields (groupby, orderby, resolutions, filters according to the new set of selected variables
        updateQDfields();

        /**
         * creates a hashmap with the dimension name as key and its frequency as value
         */
        function getDimensionFrequencyMap() {
            var dimensionMap = {};
            var $dimensions = $('#selected_dimensions option');
            $.each($dimensions, function () {
               var dimension = $(this).text();
               if (!(dimension in dimensionMap)){
                   dimensionMap[dimension] = 1;
               }
               else {
                   dimensionMap[dimension]++;
               }
            });
            return dimensionMap;
        }

        function getMaxFrequencyFromMap(frequencyMap) {
            var maxFreq = 0;
            for (var key in frequencyMap) {
                var currentValue = frequencyMap[key];
                if (currentValue > maxFreq)
                    maxFreq = currentValue;
            }
            return maxFreq;
        }

        /**
         * if a dimension is not included in all datasets then it is removed from the order by options
         */
        function removeUndesiredOrderByOptions() {
           var frequencyMap = getDimensionFrequencyMap();
           var maxFrequency = getMaxFrequencyFromMap(frequencyMap);
           var orderByOptions = $('[name="orderby"] option');
           $.each(orderByOptions, function () {
               var orderByOption = $(this).attr("data-type");
               if (frequencyMap[orderByOption] < maxFrequency)
                   $(this).remove();
           });
        }
        //if dimension is not included in all datasets then it is not desired
        removeUndesiredOrderByOptions();

        // mark as unsaved
        QueryToolbox.tabMarker.currentUnsaved();

        // reset to variables tab
        $("#chart-control-list ul li").eq(0).find("a").click();

        if (display_tour){
            first_tour.init();
            first_tour.start(true);
        }
        display_tour = false;
    };

    /* When the data selection modal closes, hide the confirmation panel at the bottom of the panel */
    $('#select-data-modal').on('hidden.bs.modal', function() {
        // Clear the modal selection
        // $("#select-data-modal .dataset-section").attr("data-selected", "False");
        // var $datasetInfoDiv = $('#dataset_info_div');
        //  // Empty the previous info
        //  $datasetInfoDiv.find("#dataset_basic_info_div").empty();
        //  $datasetInfoDiv.find("#dataset-variables-div").empty();
        //  $datasetInfoDiv.find("#dataset-dimensions-div").empty();
        //  $datasetInfoDiv.find("#dataset_metadata_div").empty();
        //  $datasetInfoDiv.addClass("hidden");
        //  $(".selection-confirm").hide()
    });


    $('#select-data-modal').on('shown.bs.modal', function() {
        // At first hide the "add" button (it should be visible only if a variable has been slected to be added)
        $('.selection-confirm').hide();

         // Mark as selected the variables that are already added to the Query Designer
         var included_vars = [];
         $.each(QueryToolbox.variables, function (_, variable) {
             included_vars.push(parseInt(variable.id));
         });
         $("#dataset-variables-div .variable-section").each(function (_, variable) {
             if(included_vars.indexOf($(variable).data('variable-id')) >= 0){
                 $(variable).attr({'data-selected': 'True'});
                 $(variable).attr({'data-disabled': 'True'});
             }
             else{
                 $(variable).attr({'data-selected': 'False'});
                 $(variable).attr({'data-disabled': 'False'});
             }
        });
    });

    function filter_datasets_on_coverage() {
        // Filter datasets on selected variables' coverages
        var time_start = new Date();
        var time_end = new Date();
        var min_lat=-90, max_lat=90, min_lon=-180, max_lon=180, min_time=time_start_timestamp, max_time=time_end_timestamp;
        $.each(QueryToolbox.variables, function (_, variable) {
            if(variable.dataset_lat_min > min_lat)
                min_lat = variable.dataset_lat_min;
            if(variable.dataset_lat_max < max_lat)
                max_lat = variable.dataset_lat_max;
            if(variable.dataset_lon_min > min_lon)
                min_lon = variable.dataset_lon_min;
            if(variable.dataset_lon_max < max_lon)
                max_lon = variable.dataset_lon_max;
            if(variable.dataset_time_min > min_time)
                min_time = variable.dataset_time_min;
            if(variable.dataset_time_max < max_time)
                max_time = variable.dataset_time_max;
        });

        $("div[data-control-name='range-slider-lat']").find(".ui-slider").slider('values', 0, min_lat);
        $("div[data-control-name='range-slider-lat-to']").find(".ui-slider").slider('values', 0, min_lat);
        $("div[data-control-name='range-slider-lat']").find(".ui-slider").slider('values', 1, max_lat);
        $("div[data-control-name='range-slider-lat-from']").find(".ui-slider").slider('values', 1, max_lat);

        $("div[data-control-name='range-slider-lon']").find(".ui-slider").slider('values', 0, min_lon);
        $("div[data-control-name='range-slider-lon-to']").find(".ui-slider").slider('values', 0, min_lon);
        $("div[data-control-name='range-slider-lon']").find(".ui-slider").slider('values', 1, max_lon);
        $("div[data-control-name='range-slider-lon-from']").find(".ui-slider").slider('values', 1, max_lon);

        $("div[data-control-name='range-slider-time']").find(".ui-slider").slider('values', 0, min_time);
        $("div[data-control-name='range-slider-time-to']").find(".ui-slider").slider('values', 0, min_time);
        $("div[data-control-name='range-slider-time']").find(".ui-slider").slider('values', 1, max_time);
        $("div[data-control-name='range-slider-time-from']").find(".ui-slider").slider('values', 1, max_time);
    }

    function reset_datasets_coverage() {
        // Filter datasets on selected variables' coverages
        var min_lat=-90, max_lat=90, min_lon=-180, max_lon=180, min_time=time_start_timestamp, max_time=time_end_timestamp;
        $("div[data-control-name='range-slider-lat']").find(".ui-slider").slider('values', 0, min_lat);
        $("div[data-control-name='range-slider-lat-to']").find(".ui-slider").slider('values', 0, min_lat);
        $("div[data-control-name='range-slider-lat']").find(".ui-slider").slider('values', 1, max_lat);
        $("div[data-control-name='range-slider-lat-from']").find(".ui-slider").slider('values', 1, max_lat);

        $("div[data-control-name='range-slider-lon']").find(".ui-slider").slider('values', 0, min_lon);
        $("div[data-control-name='range-slider-lon-to']").find(".ui-slider").slider('values', 0, min_lon);
        $("div[data-control-name='range-slider-lon']").find(".ui-slider").slider('values', 1, max_lon);
        $("div[data-control-name='range-slider-lon-from']").find(".ui-slider").slider('values', 1, max_lon);

        $("div[data-control-name='range-slider-time']").find(".ui-slider").slider('values', 0, min_time);
        $("div[data-control-name='range-slider-time-to']").find(".ui-slider").slider('values', 0, min_time);
        $("div[data-control-name='range-slider-time']").find(".ui-slider").slider('values', 1, max_time);
        $("div[data-control-name='range-slider-time-from']").find(".ui-slider").slider('values', 1, max_time);    
    }

    // $('#select-data-modal').on('shown.bs.modal', function() {
    //     if($('#select-data-modal').find('#selected_coverage_filter').prop("checked")) {
    //         // filter_datasets_on_coverage();
    //     }
    //     else{
    //         reset_datasets_coverage();
    //     }
    // });


    // $('#select-data-modal').find('#selected_coverage_filter').change(function() {
    //     if(this.checked) {
    //         filter_datasets_on_coverage();
    //     }
    //     else{
    //         reset_datasets_coverage();
    //     }
    // });


    // *** OPEN - LOAD - SAVE - RENAME QUERY *** //
    /* Add a new query - Reset the toolbox */
    $('#new-query').on('click', function () {
        $('.value-remove-btn').click();
    });



    /* On chart save */

    $('body').on('click', '#chart-save', function () {
        var curr_query_title = $('#query-save-name').val();
        if(curr_query_title.trim() == '') {
            alert('Please fill in the name for the query')
        }else{
            $('#chart-name input').val(curr_query_title).trigger('change');
            // $('.queryTitle').text(curr_query_title);
            QueryToolbox.save(function (id) {}, 0);
        }
    });

    $('body').on('click', '#chart-save-as', function () {
        var curr_query_title = $('#query-save-as-name').val();
        $('#query-save-as-name').val('');
        if(curr_query_title.trim() == '') {
            alert('Please fill in the name for the query')
        }else {
             $('#chart-name input').val(curr_query_title).trigger('change');
             // $('.queryTitle').text(curr_query_title);
             QueryToolbox.objects[0].queryId = null;
             QueryToolbox.save(function (id) {
             }, 0);
         }
    });

    $('body').on('click','#front-chart-save',function () {
        var curr_query_id = QueryToolbox.objects[0].queryId;
        if((curr_query_id === null)||(curr_query_id ==='')||typeof(curr_query_id) === 'undefined') {
            // $("#saveModal").modal("hide");
        }
        else{
            $("#saveModal .modal-body").replaceWith('' +
                '<div class="modal-body" style="height: inherit;margin-bottom: 20px; ">\n' +
                '<div id="save-modal-text">Do you want to save the query: </div>\n' +
                '<input class="form-control" id="query-save-name" type="text" style="width: 75%;" value="'+String($("#chart-name input").val())+'"> ?               ' +
                '</div>')

        }
    });



    /* On chart open dialog */
    $('body').on('click', '#chart-open', function () {
        QueryToolbox.chartLoadDialog.open();
    });

    /* On chart open */
    $('body').on('click', '.chart-open-teaser td:not(:last-child)', function () {
        QueryToolbox.chartLoadDialog.close();
        QueryToolbox.load($(this).closest('.chart-open-teaser').data('query_id'));
    });

    /* On chart rename */
    $('body #chart-name input').on('change', function () {
        QueryToolbox.rename($(this).val());
    });



    // *** VARIABLE FIELDS - GROUPBY - ORDERING - RESOLUTIONS *** //
    /* On variable remove */
    $('body').on('click', '.value-remove-btn', function () {
        // mark as unsaved
        QueryToolbox.tabMarker.currentUnsaved();
        QueryToolbox.removeVariableField($(this).closest('.fieldset'));
        $(".fieldset").each(function (idx, elem) {
            $(elem).find('.metric-cnt').text(String(idx+1));
        });

        var variable_id = $(this).closest('.fieldset').find('[name="variable_field"]').data('variable-id');
        $.each(QueryToolbox.variables, function (idx, variable) {
            if(parseInt(variable_id) === parseInt(variable.id)){
                QueryToolbox.variables.splice(idx, 1);
                return false; // break
            }
        });

        var common_dimensions = update_datasets_and_common_dimensions();
        $("#joined_dimensions_div").html("").addClass("hidden");

        if (QueryToolbox.datasets.length === 1){
            //automatically fill spatial and temporal resolution when joining datasets
            $('#temporal_resolution').val('');
            $('#temporal_resolution').trigger('change');
            $('#spatial_resolution').val('');
            $('#spatial_resolution').trigger('change');
        }

        if (QueryToolbox.datasets.length > 1){
            $("#joined_dimensions_div").removeClass("hidden");
            $("#joined_dimensions_div").append("<p style='margin: 0;'>Datasets joined on their common fields:</p>");
            for (var i=0; i<common_dimensions.length; i++) {
                if(i === common_dimensions.length-1){
                    $("#joined_dimensions_div").append("<span>"+common_dimensions[i]+"</span>");
                }
                else{
                    $("#joined_dimensions_div").append("<span>"+common_dimensions[i]+", </span>");
                }
            }
            if($('#spatial_resolution').val() !== "")
                $("#joined_dimensions_div").append("<p id='harmonised_space' style='margin: 0;'>Harmonised on space: " + $('#spatial_resolution').val() + "deg</p>");
            if($('#temporal_resolution').val() !== "")
                $("#joined_dimensions_div").append("<p id='harmonised_time' style='margin: 0;'>Harmonised on time: " + $('#temporal_resolution').val() +"</p>");

        }

        $("#join_warning_div").addClass("hidden");
        if(QueryToolbox.datasets.length > 2){
            $("#join_warning_div").removeClass("hidden");
        }

        updateQDfields();
    });

    /* On spatial resolution field change */
    $('body').on('change', '#spatial_resolution', function (e) {
        // update spatial resolution
        QueryToolbox.spatial_resolution = $("#spatial_resolution").val();
         update_group_by_when_spatial_resolution();
        // if spatial resolution is defined
        if($("#spatial_resolution").val() !== ''){
            // Each variable should have an aggregation function
            $("select[name='field_aggregate']").each(function () {
                $(this).val($(this).find('option').eq(1).val());
                $(this).trigger("change");
            });
            // Disable the 'no-aggregate' option
            $("select[name='field_aggregate']").find('option[value=""]').each(function () {
                $(this).attr('disabled', 'disabled');
            });


            $("#joined_dimensions_div #harmonised_space").html("Harmonised on space: " + $('#spatial_resolution').val() + "deg");

            // remove latitude and longitude from group by options
            // $("#id_category > option[data-title='longitude']").remove();
            // $("#id_category > option[data-title='latitude']").remove()
        }
        // if spatial resolution is NOT defined
        else{
            // check if spatial resolution is defined
            if ($("#temporal_resolution").val() === "") {
                // check if group-by is defined and either reset or not the aggregate values
                if ($('[name="category"]').val().length === 0) {
                    $("select[name='field_aggregate']").find('option[value=""]').each(function () {
                        $(this).attr('disabled', false);
                    });
                    $("select[name='field_aggregate']").each(function () {
                        $(this).val("");
                        $(this).trigger("change");
                    });
                }
            }
            $("#joined_dimensions_div #harmonised_space").html("");
        }
        // mark as unsaved
        QueryToolbox.tabMarker.currentUnsaved();
    });

    /* On temporal resolution field change */
    $('body').on('change', '#temporal_resolution', function (e) {
        // update temporal resolution
        QueryToolbox.temporal_resolution = $("#temporal_resolution").val();
        update_group_by_when_temporal_resolution();
        if($("#temporal_resolution").val() !== ''){
            // Each variable should have an aggregation function
            $("select[name='field_aggregate']").each(function () {
                $(this).val($(this).find('option').eq(1).val());
                $(this).trigger("change");
            });
            // Disable the 'no-aggregate' option
            $("select[name='field_aggregate']").find('option[value=""]').each(function () {
                $(this).attr('disabled', 'disabled');
            });

            $("#joined_dimensions_div #harmonised_time").html("Harmonised on time: " + $('#temporal_resolution').val());
            // remove time from group by options
            // $("#id_category > option[data-title='time']").remove()
        }
        else{
            // check if spatial resolution is defined
            if ($("#spatial_resolution").val() === "") {
                // check if group-by is defined and either reset or not the aggregate values
                if ($('[name="category"]').val().length === 0) {
                    $("select[name='field_aggregate']").find('option[value=""]').each(function () {
                        $(this).attr('disabled', false);
                    });
                    $("select[name='field_aggregate']").each(function () {
                        $(this).val("");
                        $(this).trigger("change");
                    });
                }
            }
            $("#joined_dimensions_div #harmonised_time").html("");
        }
        $("select[name='field_aggregate']").select2();
        // mark as unsaved
        QueryToolbox.tabMarker.currentUnsaved();
    });

    /* On groupby field change */
    $('body').on('change', 'select[name="category"]', function (e) {
        QueryToolbox.groupings = [];
        // The groupby select field
        var $categorySelectField = $('[name="category"]');
        // The already selected values
        var $selected_options = $categorySelectField.find("option:selected");
        $.each($selected_options, function (_, option) {
            QueryToolbox.groupings.push(
                {'dimension_id': $(option).data('dimension-id'),
                 'dimension_name': $(option).data('name'),
                 'dimension_forVariable': $(option).data('forvariable')
                })
        });

        // if a group by column is selected, put the AVG as the default aggr function to all variables
        if($("select[name='category']").val().length > 0){
            // Each variable should have an aggregation function
            $("select[name='field_aggregate']").each(function () {
                $(this).val($(this).find('option').eq(1).val());
                $(this).trigger("change");
            });
            // Disable the 'no-aggregate' option
            $("select[name='field_aggregate']").find('option[value=""]').each(function () {
                $(this).attr('disabled', 'disabled');
            });
        }
        else{
            // check if spatial resolution is defined
            if ($("#spatial_resolution").val() === "") {
                // check if temporal resolution is defined
                if ($("#temporal_resolution").val() === "") {
                    $("select[name='field_aggregate']").find('option[value=""]').each(function () {
                        $(this).attr('disabled', false);
                    });
                    $("select[name='field_aggregate']").each(function () {
                        $(this).val("");
                        $(this).trigger("change");
                    });
                }
            }
        }
        // mark as unsaved
        QueryToolbox.tabMarker.currentUnsaved();
        update_fields_when_grouping();
    });

    /* On ordering field change */
    $('body').on('change', 'select[name="orderby"]', function (e) {
        QueryToolbox.orderings = [];
        // The ordering select field
        var $orderingSelectField = $('[name="orderby"]');
        // The already selected values
        var $selected_options = $orderingSelectField.find("option:selected");

        // Disable the opposite ordering types
        $orderingSelectField.find("option").attr('disabled', false);
        $.each($selected_options, function (_, opt) {
            var ordering = $(opt).data("ordering");
            var column_type = $(opt).data("type");
            if(column_type === 'dimension'){
                var dimension_id = $(opt).data("dimension-id");
                $orderingSelectField.find("option").filter("[data-dimension-id='"+dimension_id+"']").not("[data-ordering='"+ordering+"']").attr('disabled', 'disabled');
            }
            if(column_type === 'variable'){
                var variable_id = $(opt).data("variable-id");
                $orderingSelectField.find("option").filter("[data-variable-id='"+variable_id+"']").not("[data-ordering='"+ordering+"']").attr('disabled', 'disabled');
            }
        });



        // $orderingSelectField.select2();
        // $orderingSelectField.select2({
        //     width: "100%",
        //     escapeMarkup: function(markup) {
        //         return markup;
        //     }
        // });


        $.each($selected_options, function (_, option) {
            if($(option).data('type') === 'dimension'){
                QueryToolbox.orderings.push(
                    {'dimension_id': $(option).data('dimension-id'),
                     'name': $(option).data('name'),
                     'dimension_forVariable': $(option).data('forvariable'),
                     'ordering': $(option).data('ordering'),
                     'type': 'dimension'
                    }
                )
            }
            else{
                QueryToolbox.orderings.push(
                    {'variable_id': $(option).data('variable-id'),
                     'name': $(option).data('name'),
                     'ordering': $(option).data('ordering'),
                     'type': 'variable'
                    }
                )
            }
        });
        // mark as unsaved
        QueryToolbox.tabMarker.currentUnsaved();
        update_fields_when_ordering_asc_desc();
    });

    /* On aggregate change */
    $('body').on('change', 'select[name="field_aggregate"]', function () {
        var aggr = $(this).val();
        var $variable_field = $(this).closest('.fieldset').find('[name="variable_field"]');
        $.each(QueryToolbox.variables, function (_, variable) {
            if(parseInt(variable.id) === parseInt($variable_field.data('variable-id'))){
                variable.aggregate = aggr;
            }
        });
        // $(this).select2();
        // mark as unsaved
        QueryToolbox.tabMarker.currentUnsaved();
    });




    // *** FILTERS *** //
    /* On chart edit filters */
    $('body').on('click', '.filter-edit-open', function () {
        QueryToolbox.filterManager.show();
    });

    /* On chart new filter variable change */
    $('body').on('change', '#new-filter-variable', function () {
        QueryToolbox.filterManager.getFilterOptions();
    });
    $('body').on('change', '#new-filter-operator', function () {
        $filterOperand = $('#new-filter-operator');
        $input = $("[name='new-filter-value']");
        if($filterOperand.val() === "not_null"){
            $input.val("");
            $input.prop("readonly", true);
            $input.css({"display": "none"});
        }
        else{
            $input.val("");
            $input.prop("readonly", false);
            $input.css({"display": "block"});
        }
    });

    /* On chart add new filter */
    $('body').on('click', '.add-new-filter', function () {
        var filter_input = $("#new-filter-value-container input").val();
        if((filter_input === null)||(filter_input.trim() ==='')||typeof(filter_input) === 'undefined'){
            if ($('#new-filter-operator').val() !== "not_null") {
                alert('The value of the new filter cannot be empty!')
            }
            else{
                QueryToolbox.filterManager.addFilter();
            }
        }else {
            QueryToolbox.filterManager.addFilter();
        }
    });

    /* On filter expression type change */
    $('body').on('change', '#filters-expr-type', function () {
        // mark as unsaved
        QueryToolbox.tabMarker.currentUnsaved();
        QueryToolbox.filterManager.setExpressionType($(this).val());
    });

    /* On filter remove */
    $('body').on('click', '.remove-filter-btn', function () {
        // mark as unsaved
        QueryToolbox.tabMarker.currentUnsaved();
        QueryToolbox.filterManager.removeFilter($(this).closest('tr').find('> td:first-of-type').text());
    });


    function decide_message(){
        var magnitude = "";
        var number_of_digits = 0;
        // Check if magnitude is thousands
        $.each(QueryToolbox.variables, function (_, v_obj) {
            if(v_obj.dataset_size.indexOf("thousand") > 0){
                magnitude = "thousand";
            }
        });
        // Check if magnitude is millions
        $.each(QueryToolbox.variables, function (_, v_obj) {
            if(v_obj.dataset_size.indexOf("million") > 0){
                magnitude = "million";
            }
        });
        // Check if magnitude is billions
        $.each(QueryToolbox.variables, function (_, v_obj) {
            if(v_obj.dataset_size.indexOf("billion") > 0){
                magnitude = "billion";
            }
        });
        // Check largest number of digits of the largest magnitude
        $.each(QueryToolbox.variables, function (_, v_obj) {
            if(v_obj.dataset_size.indexOf(magnitude) > 0){
                if(number_of_digits < v_obj.dataset_size.split(" ")[0].length){
                    number_of_digits = v_obj.dataset_size.split(" ")[0].length;
                }
            }
        });


        var message = "We are fetching your data. ";

        if(QueryToolbox.datasets.length > 1){
            message += String(QueryToolbox.datasets.length) + " large datasets are combined. It may take a few minutes, please wait.";
        }
        else if(QueryToolbox.groupings.length > 0){
            message += " They are grouped based on your selection. It may take 1-2 minutes, please wait.";
        }
        else if(QueryToolbox.temporal_resolution !== "" && QueryToolbox.spatial_resolution !== "" ){
            message += " They are being harmonised on space and time.\n";
            if (magnitude === "billion")
                message += " The dataset used contains billions of data and it may take 10-12 minutes, please wait.";
            else if (magnitude === "million" && number_of_digits > 2)
                message += " The dataset used contains hundreds of millions of rows and it may take a few minutes, please wait.";
            else
                message += " It may take 1-2 minutes, please wait.";
        }
        else if(QueryToolbox.spatial_resolution !== ""){
            message += " They are being harmonised on space.\n";
            if (magnitude === "billion")
                message += " The dataset used contains billions of data and it may take 10-12 minutes, please wait.";
            else if (magnitude === "million" && number_of_digits > 2)
                message += " The dataset used contains hundreds of millions of rows and it may take a few minutes, please wait.";
            else
                message += " It may take 1-2 minutes, please wait.";
        }
        else if(QueryToolbox.temporal_resolution !== ""){
            message += " They are being harmonised on time.\n";
            if (magnitude === "billion")
                message += " The dataset used contains billions of data and it may take 10-12 minutes, please wait.";
            else if (magnitude === "million" && number_of_digits > 2)
                message += " The dataset used contains hundreds of millions of rows and it may take a few minutes, please wait.";
            else
                message += " It may take 1-2 minutes, please wait.";
        }
        else{
            message += " It will not take long.";
        }

        return message;
    }

    function updated_available_visualisations(){
        var possible_vessel_identifiers = ["platform_id", "platform_id_hash", "ship_id", "ship_name", "imo_id", 'imo', "voyage_number", "trip_identifier", "mmsi"];
        var hasLiveAIS = false;
            $.each(QueryToolbox.dataset_names, function (idx, dataset) {
               if(dataset.toLowerCase().indexOf("time") >= 0 && dataset.toLowerCase().indexOf("real") >= 0){
                   hasLiveAIS = true;
               }
            });
        $("#viz_group_container .viz_item").removeClass("viz_item_disabled").prop('title', '').prop('data-toggle', '');
        $('.tooltip').remove();
        if (QueryToolbox.common_dimensions.indexOf("latitude") < 0 || QueryToolbox.common_dimensions.indexOf("longitude") < 0){
            var tooltip_title = 'This type of visualisation cannot be created for the current data. They do not contain latitude and longitude fields.';
            $("#viz_group_container  .viz_item[data-viz-name='get_map_heatmap']").addClass("viz_item_disabled").prop('title', tooltip_title).prop('data-toggle', 'tooltip').tooltip({trigger: "hover"});
            $("#viz_group_container  .viz_item[data-viz-name='get_map_contour']").addClass("viz_item_disabled").prop('title', tooltip_title).prop('data-toggle', 'tooltip').tooltip({trigger: "hover"});
            $("#viz_group_container  .viz_item[data-viz-name='get_map_plotline_vessel_course']").addClass("viz_item_disabled").prop('title', tooltip_title).prop('data-toggle', 'tooltip').tooltip({trigger: "hover"});
            $("#viz_group_container  .viz_item[data-viz-name='get_map_markers_vessel_course']").addClass("viz_item_disabled").prop('title', tooltip_title).prop('data-toggle', 'tooltip').tooltip({trigger: "hover"});
            $("#viz_group_container  .viz_item[data-viz-name='get_map_markers_grid']").addClass("viz_item_disabled").prop('title', tooltip_title).prop('data-toggle', 'tooltip').tooltip({trigger: "hover"});
            $("#viz_group_container  .viz_item[data-viz-name='get_map_polygon']").addClass("viz_item_disabled").prop('title', tooltip_title).prop('data-toggle', 'tooltip').tooltip({trigger: "hover"});
        }
        if (QueryToolbox.common_dimensions.indexOf("time") < 0){
            var tooltip_title = 'This type of visualisation cannot be created for the current data. They do not contain the field "time".';
            $("#viz_group_container  .viz_item[data-viz-name='get_time_series_am']").addClass("viz_item_disabled").prop('title', tooltip_title).prop('data-toggle', 'tooltip').tooltip({trigger: "hover"});
            $("#viz_group_container  .viz_item[data-viz-name='get_map_plotline_vessel_course']").addClass("viz_item_disabled").prop('title', tooltip_title).prop('data-toggle', 'tooltip').tooltip({trigger: "hover"});
            $("#viz_group_container  .viz_item[data-viz-name='get_map_markers_vessel_course']").addClass("viz_item_disabled").prop('title', tooltip_title).prop('data-toggle', 'tooltip').tooltip({trigger: "hover"});
        }
        if (QueryToolbox.common_dimensions.filter(value => -1 !== possible_vessel_identifiers.indexOf(value)).length <= 0){
            var tooltip_title = 'This type of visualisation cannot be created for the current data. They do not contain a vessel identifier field.';
            $("#viz_group_container  .viz_item[data-viz-name='get_map_plotline_vessel_course']").addClass("viz_item_disabled").prop('title', tooltip_title).prop('data-toggle', 'tooltip').tooltip({trigger: "hover"});
            $("#viz_group_container  .viz_item[data-viz-name='get_map_markers_vessel_course']").addClass("viz_item_disabled").prop('title', tooltip_title).prop('data-toggle', 'tooltip').tooltip({trigger: "hover"});
        }
        if (hasLiveAIS){
            $("#viz_group_container  .viz_item[data-viz-name='get_live_ais']").removeClass("viz_item_disabled").prop('title', tooltip_title).prop('data-toggle', 'tooltip').tooltip({trigger: "hover"});
        }
        else{
            var tooltip_title = 'This type of visualisation cannot be created for the current data. Real time AIS data are required.';
            $("#viz_group_container  .viz_item[data-viz-name='get_live_ais']").addClass("viz_item_disabled").prop('title', tooltip_title).prop('data-toggle', 'tooltip').tooltip({trigger: "hover"});
        }
    }

    // *** RUN QUERY / EXPLORE RESULTS *** //
    /* On run query btn click, execute the query and fetch results */
    $('body').on('click', '#run-query-btn', function (e) {
        var $this = $(this);
        if ($this.hasClass('clicked')){
            $this.removeClass('clicked');
            //here is your code for double click
            execute_query();
        }else{
             $this.addClass('clicked');
             setTimeout(function() {
                 if ($this.hasClass('clicked')){
                     $this.removeClass('clicked');
                     //your code for single click
                     execute_query();
                 }
             }, 300);
        }
    });

    function execute_query () {
        $('#run-query-btn').attr('disabled', 'disabled');
        if(QueryToolbox.datasets.length <= 2){
            var hasGlobal = false;
            $.each(QueryToolbox.dataset_names, function (idx, dataset) {
               if(dataset.toLowerCase().indexOf("global") >= 0){
                   hasGlobal = true;
               }
            });

            if(hasGlobal  && startdate === null && enddate === null && bounds[0] === -90 && bounds[1] === -180 && bounds[2] === 90 && bounds[3] === 180) {
                // var r = confirm("You are trying to query a very large dataset with global measurements. \n" +
                //     "This operation requires some time and it is recommended to filter your selection on space and time. \n" +
                //     "Do you want to filter your query to a smaller area for faster results before the execution?");
                // if (r == true) {
                //     $("#chart-sidebar #chart-control-list .nav-pills li").eq(1).find('a').click();
                //
                //     setTimeout(function () {
                //         $("#mappreview").click();
                //     }, 1000);
                //
                // } else {
                //     proceed_to_execute();
                // }
                $("#global_message_alert").show();
                $("#chart-sidebar #chart-control-list .nav-pills li").eq(1).find('a').click();
            }
            else if(hasGlobal  && ((bounds[2] - bounds[0] > 25) || (bounds[3] - bounds[1] > 43))){
                $("#spatial_filter_message_alert").show();
                $("#chart-sidebar #chart-control-list .nav-pills li").eq(1).find('a').click();
            }            else{
                proceed_to_execute();
            }
        }
        else{
            alert("You have selected variables from more than two different datasets. Please update your selection.");
        }
    };

    function proceed_to_execute(){
        $('a[href="#dataDiv"]').trigger('click');
        $("#viz_config .list-group").children().each(function () {
            $(this).find("#selected_viz_span").hide();
        });

        var message = decide_message();
        $(".outputLoadImg #loading_message").html(message);

        $(".outputLoadImg").hide();
        $(".outputLoadImg").delay(100).show();

        updated_available_visualisations();

        QueryToolbox.fetchQueryData();
    }

    /* On next page btn click, increase the offset and execute the query to fetch results */
    $('body').on('click', '#dataNextBtn', function () {
        var page = parseInt($('#paginationDiv').attr("page"));
        if (page >= 0){
            $('#dataPrevBtn').prop('disabled', false);
        }

        $('#graph-data-table > tbody > tr[page="'+ page +'"]').hide();
        page++;
        $('#graph-data-table > tbody > tr[page="' + page + '"]').show();
        $('#paginationDiv').attr("page",page);
        lastPage = parseInt($('#paginationDiv').attr("lastpage"));
        if (page >= lastPage) {
            $(this).prop('disabled', true);
        }
    });

    /* On prev page btn click, decrease the offset and execute the query to fetch results */
    $('body').on('click', '#dataPrevBtn', function () {
        var page = parseInt($('#paginationDiv').attr("page"));
        lastPage = parseInt($('#paginationDiv').attr("lastpage"));

        if (page <= lastPage){
            $('#dataNextBtn').prop('disabled', false);
        }

        $('#graph-data-table > tbody > tr[page="'+ page +'"]').hide();
        page--;
        $('#graph-data-table > tbody > tr[page="'+page+'"]').show();
        $('#paginationDiv').attr("page",page)
        if (page <= 0) {
            $(this).prop('disabled', true);
        }
    });


    $('body').on('click', '.delete_query_icon', function () {
        var $that_row = $(this).closest('tr');
        var queryId = $(this).closest('tr').find('td').eq(0).html();
        var r = confirm("Are you sure you want to delete the selected query?");
        if (r == true) {
            $.ajax({
                url: '/queries/delete/' + queryId + '/',
                type: 'POST',
                data: {
                    csrfmiddlewaretoken: $('[name="csrfmiddlewaretoken"]').val()
                },
                success: function (data) {
                    $that_row.remove();
                    alert("Query successfully deleted.");
                },
                error: function (data) {
                    alert("An error occured.");
                    console.log(data);
                }
            })
        }
    });

    $("#choices select").on("select2:unselecting", function () {
        // $("#lat_min").val("").trigger('change');
        // $("#lat_max").val("").trigger('change');
        // $("#lon_min").val("").trigger('change');
        // $("#lon_max").val("").trigger('change');
        // bounds = [-90,-180,90,180]
        $('#resetMapBounds').click();
    });




    // *** SHOW VARIABLE DIMENSIONS *** //
    $('body').on('click', '.fieldset input[readonly]', function () {
        $(this).closest('.fieldset').find('.collapse').collapse("toggle");
    });

    // *** Stop Visualisation *** //
    $('body').on('click', '#stop_viz_btn', function () {
        $('#viz_container').find('iframe').remove();
        $('#viz_container').find(".outputLoadImg").css("display", "none");
        $('#viz_container').append('<iframe onload="hide_gif();"></iframe>');
    });

});


function updateQDfields() {
    var common_dimension_list = joined_datasets_common_dimensions_list();
    updateGroupByField(common_dimension_list);
    updateOrderByField(common_dimension_list);
    updateFilterByField();
}


function updateGroupByField(common_dimension_list) {
    // The groupby select field
    var $categorySelectField = $('[name="category"]');

    // Empty the field to re-enter the options
    $categorySelectField.find("option").remove();
    $categorySelectField.val('');

    $.each(QueryToolbox.variables, function (_, variable) {
        $.each(variable.dimensions, function (_, dimension) {
            if (($categorySelectField.find("option[data-name='" + dimension.name + "']").length === 0)&&(common_dimension_list.includes(dimension.name))) {
                // Create a DOM Option and pre-select by default
                var newOption = new Option(dimension.title, dimension.id, false, false);
                newOption.setAttribute('data-forVariable', variable.id);
                newOption.setAttribute('data-dimension-id', dimension.id);
                newOption.setAttribute('data-name', dimension.name);
                if((dimension.name==='time')&&($('#temporal_resolution').val() !== '')){
                    newOption.setAttribute('disabled','disabled');
                }else if(((dimension.name==='latitude')||(dimension.name==='longitude'))&&($('#spatial_resolution').val() !== '')){
                    newOption.setAttribute('disabled','disabled');
                }
                // if a dimensions was previously selected, then select it again
                $.each(QueryToolbox.groupings, function (idx, elem) {
                    if(elem.dimension_name === dimension.name){
                        newOption.setAttribute('selected','selected');
                    }
                });
                // Append it to the select
                $categorySelectField.append(newOption);
            }
        })
    });
    $categorySelectField.trigger('change');
}

function updateOrderByField(common_dimension_list) {
    // The orderby select field
    var $orderbySelectField = $('[name="orderby"]');

    // Empty the field to re-enter the options
    $orderbySelectField.find("option").remove();
    $orderbySelectField.val('');

    $.each(QueryToolbox.variables, function (idx, variable) {
        $.each(variable.dimensions, function (_, dimension) {
            // Append the dimensions
            if (($orderbySelectField.find("option[data-name='" + dimension.name + "']").length === 0)&&(common_dimension_list.includes(dimension.name))) {
                //Ascending order
                var newOption = new Option('<i class="fa fa-arrow-up"></i> ' + dimension.title, 'dimension__'+dimension.id+'__ASC', false, false);
                newOption.setAttribute('data-forVariable', variable.id);
                newOption.setAttribute('data-dimension-id', dimension.id);
                newOption.setAttribute('data-ordering', 'ASC');
                newOption.setAttribute('data-name', dimension.name);
                newOption.setAttribute('data-type', 'dimension');
                // if a dimensions was previously selected, then select it again
                $.each(QueryToolbox.orderings, function (idx, elem) {
                    if((elem.type === 'dimension') && (elem.name === dimension.name) && (elem.ordering === 'ASC')){
                        newOption.setAttribute('selected','selected');

                    }
                });
                $orderbySelectField.append(newOption);
                //Descending order
                newOption = new Option('<i class="fa fa-arrow-down"></i> ' + dimension.title, 'dimension__'+dimension.id+'__DESC', false, false);
                newOption.setAttribute('data-forVariable', variable.id);
                newOption.setAttribute('data-dimension-id', dimension.id);
                newOption.setAttribute('data-ordering', 'DESC');
                newOption.setAttribute('data-name', dimension.name);
                newOption.setAttribute('data-type', 'dimension');
                // if a dimensions was previously selected, then select it again
                $.each(QueryToolbox.orderings, function (idx, elem) {
                    if((elem.type === 'dimension') && (elem.name === dimension.name) && (elem.ordering === 'DESC')){
                        newOption.setAttribute('selected','selected');
                    }
                });
                $orderbySelectField.append(newOption);
            }
        });
        // Append the variable, too
        //Ascending order
        var newOption = new Option('<i class="fa fa-arrow-up"></i> ' + variable.title + ' (Metric #'+(idx+1)+')', 'variable__'+variable.id+'__ASC', false, false);
        newOption.setAttribute('data-variable-id', variable.id);
        newOption.setAttribute('data-ordering', 'ASC');
        newOption.setAttribute('data-name', variable.name);
        newOption.setAttribute('data-type', 'variable');
        // if the variable was previously selected, then select it again
        $.each(QueryToolbox.orderings, function (idx, elem) {
            if((elem.type === 'variable') && (parseInt(elem.variable_id) === parseInt(variable.id)) && (elem.ordering === 'ASC')){
                newOption.setAttribute('selected','selected');
            }
        });
        $orderbySelectField.append(newOption);
        //Descending order
        newOption = new Option('<i class="fa fa-arrow-down"></i> ' + variable.title + ' (Metric #'+(idx+1)+')', 'variable__'+variable.id+'__DESC', false, false);
        newOption.setAttribute('data-variable-id', variable.id);
        newOption.setAttribute('data-ordering', 'DESC');
        newOption.setAttribute('data-name', variable.name);
        newOption.setAttribute('data-type', 'variable');
        // if the variable was previously selected, then select it again
        $.each(QueryToolbox.orderings, function (idx, elem) {
            if((elem.type === 'variable') && (parseInt(elem.variable_id) === parseInt(variable.id)) && (elem.ordering === 'DESC')){
                newOption.setAttribute('selected','selected');
            }
        });
        $orderbySelectField.append(newOption);
    });
    $orderbySelectField.trigger('change');
}

function joined_datasets_common_dimensions_list(){
     //Create a list of only common dimensions of joined datasets
    var common_dimensions_list=[];
    var single_var;
    if(QueryToolbox.variables.length>1) {
        single_var = QueryToolbox.variables[0].dimensions;
        for (var i = 0; i < single_var.length; i++) {
            var common_dimension_flag = true;
            var curr_var = QueryToolbox.variables;
            for (var j_var = 1; j_var < curr_var.length; j_var++) {
                var exists_in_var = false;
                for (var i_dim = 0; i_dim < curr_var[j_var].dimensions.length; i_dim++) {
                    if (single_var[i].name === curr_var[j_var].dimensions[i_dim].name) {
                        exists_in_var = true;
                    }
                }
                if (exists_in_var === false) {
                    common_dimension_flag = false;
                }
            }
            if (common_dimension_flag === true) {
                common_dimensions_list.push(single_var[i].name);
            }
        }
    }
    else if (QueryToolbox.variables.length===1){
        single_var = QueryToolbox.variables[0].dimensions;
        for (var i = 0; i < single_var.length; i++) {
            common_dimensions_list.push(single_var[i].name);
        }
    }
    else{
        common_dimensions_list = [];
    }
    return common_dimensions_list;
}

function update_fields_when_ordering_asc_desc() {
    $('[name="orderby"] option').removeAttr('disabled');
    var $opposite_ordering_option;
    $.each(QueryToolbox.orderings, function (idx, elem) {
        if (elem.ordering === 'ASC') {
            $opposite_ordering_option = $('[name="orderby"] option[data-name="' + elem.name + '"][data-ordering="DESC"]');
            $opposite_ordering_option.attr('disabled', 'disabled');
        }else if(elem.ordering === 'DESC'){
            $opposite_ordering_option = $('[name="orderby"] option[data-name="' + elem.name + '"][data-ordering="ASC"]');
            $opposite_ordering_option.attr('disabled', 'disabled');
        }
    });


    setTimeout(refresh_selects2, 1000);
}

function update_group_by_when_temporal_resolution() {
    var $group_option = $('[name="category"] option[data-name="time"]');
    $group_option.removeAttr('disabled');
    if ($('#temporal_resolution').val() !== ''){
        $group_option.attr('disabled', 'disabled');
    }
    refresh_selects2();
}

function update_group_by_when_spatial_resolution() {
    var $group_option1 = $('[name="category"] option[data-name="latitude"]');
    var $group_option2 = $('[name="category"] option[data-name="longitude"]');
    $group_option1.removeAttr('disabled');
    $group_option2.removeAttr('disabled');
    if ($('#spatial_resolution').val() !== ''){
        $group_option1.attr('disabled', 'disabled');
        $group_option2.attr('disabled', 'disabled');
    }
    refresh_selects2();
}

function update_fields_when_grouping() {
    $('#temporal_resolution').removeAttr('disabled');
    $('#spatial_resolution').removeAttr('disabled');
    $.each(QueryToolbox.groupings, function (idx, elem) {
        if (elem.dimension_name === 'time') {
            $('#temporal_resolution').attr('disabled', 'disabled');
        } else if ((elem.dimension_name === 'latitude') || (elem.dimension_name === 'longitude')) {
            $('#spatial_resolution').attr('disabled', 'disabled');
        }
    });
}

function refresh_selects2(){
    $('.query-controls-container select').select2({
        width: "100%",
        escapeMarkup: function(markup) {
            return markup;
        }
    });
}



function reset(){
        $('.value-remove-btn').click();
        $('#selected_dimensions > option').remove();
        $('#id_category > option').remove();
        $('#id_orderby > option').remove();
        $('#resetMapBounds').click();
        $('#resetDates').click();
        $('#chart-filters > .filter').remove();
        QueryToolbox.objects[0].queryId = null;
        $('#chart-name input').val('').trigger('change');
        $('#temporal_resolution').val('').trigger('change');
        $('#spatial_resolution').val('').trigger('change');
        $('.queryTitle').text('');
        $("#saveModal .modal-body").replaceWith('<div class="modal-body" style="height: inherit;margin-bottom: 20px; ">\n' +
            '                    <div id="save-modal-text">Fill in the name and click on \'Save\' to store the current Query.</div>\n' +
            '                    <input class="form-control" id="query-save-name" type="text" placeholder="Query Name" style="width: 100%; padding: 3px; height: 100%;margin-top: 20px">\n' +
            '\n' +
            '                </div>')


        // if(!$('#select-data-modal').is(':visible')){
        //     $('.add-value-field').click();
        // }
        $('.jplist-reset-btn').click();

        // $('#lat_min').val("").trigger('change');
        // $('#lat_max').val("").trigger('change');
    }

function updateFilterByField(){
    var $filterSelectField = $('#new-filter-variable');

    // Empty the field to re-enter the options
    $filterSelectField.find("option").remove();
    $filterSelectField.val('');


    $.each(QueryToolbox.variables, function (idx, variable) {
        $.each(variable.dimensions, function (_, dimension) {
            if ($filterSelectField.find("option[data-name='" + dimension.name + "']").length === 0) {
                if((dimension.name !== 'time') && (dimension.name !== 'latitude') && (dimension.name !== 'longitude')) {
                    var newOption = new Option(dimension.title, 'dimension__' + dimension.id, false, false);
                    newOption.setAttribute('data-forvariable', variable.id);
                    newOption.setAttribute('data-id', dimension.id);
                    newOption.setAttribute('data-name', dimension.name);
                    newOption.setAttribute('data-type', 'dimension');
                    newOption.setAttribute('data-title', dimension.title);
                    $filterSelectField.append(newOption);
                }
            }
        });
        // Append the variable, too
        var newOption = new Option(variable.title + ' (Metric #'+(idx+1)+')', 'variable__'+variable.id, false, false);
        newOption.setAttribute('data-id', variable.id);
        newOption.setAttribute('data-name', variable.name);
        newOption.setAttribute('data-type', 'variable');
        newOption.setAttribute('data-forvariable', variable.id);
        newOption.setAttribute('data-title', variable.title);
        $filterSelectField.append(newOption);
    });
    $filterSelectField.trigger('change');

    // if a filter was previously defined, then define it again
    updateSelectedFilters();
}

function updateSelectedFilters(){
    var updated_filters = [];

    $.each(Object.keys(QueryToolbox.filters), function (fidx, fkey) {
        var found = false;
        var filter = QueryToolbox.filters[fkey];
        $.each(QueryToolbox.variables, function (vidx, variable) {
            // Is it a dimension filter?
            if ((filter.a_type === "dimension") && (found === false)) {
                $.each(variable.dimensions, function (didx, dimension) {
                    if (filter.a_title === dimension.title) {
                        filter.a = dimension.id;
                        filter.a_forVariable = variable.id;
                        updated_filters[fkey] = filter;
                        found = true;
                    }
                })
            }
            if ((filter.a_type === "variable") && (parseInt(filter.a) === parseInt(variable.id))) {
                updated_filters[fkey] = filter;
            }
        })
    });

    QueryToolbox.filters = updated_filters;
    $(".filter-counter").text(Object.keys(QueryToolbox.filters).length);
}