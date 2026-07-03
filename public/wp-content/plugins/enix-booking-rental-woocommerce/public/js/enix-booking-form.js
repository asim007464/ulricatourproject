/**
 * Enix Booking Rental Plugin - Booking Form Frontend JS
 */
jQuery(document).ready(function($) {
    'use strict';

    // Loop through each booking form widget on the page
    $('.enix-booking-form-widget').each(function() {
        var $widget = $(this);
        var $form = $widget.find('.enix-bf-form');
        var $btnSubmit = $widget.find('.enix-bf-submit');
        var $messageBox = $widget.find('.enix-bf-message');
        var $inputPickup = $widget.find('input[name="pickup_date"]');
        var $inputDropoff = $widget.find('input[name="dropoff_date"]');
        var $inputGuests = $widget.find('input[name="guests"]');
        var productId = $form.data('product-id');


        // Live price calculation
        var basePrice = parseFloat($form.data('base-price')) || 0;
        var basePaxLimit = parseInt($form.data('base-pax-limit'), 10) || 4;
        var extraCharge = parseFloat($form.data('extra-surcharge')) || 0;
        var minPax = parseInt($form.data('min-pax'), 10) || 1;
        var maxSeats = parseInt($form.data('max-seats'), 10) || 6;
        var durationDays = parseInt($form.data('duration-days'), 10) || 1;
        var rentalType = ($form.data('rental-type') || '').toString();
        var tripType = ($form.data('trip-type') || 'round-trip').toString();
        var isOneWayTaxi = rentalType === 'taxi' && tripType === 'one-way';
        var currency = $form.data('currency') || '$';
        var $totalValue = $widget.find('.enix-bf-total-value');
        var $inputLocation = $widget.find('select[name="departure_location"]');
        var hasLocations = $inputLocation.length > 0;
        var $availableValue = $widget.find('.enix-bf-available-value');
        var $submitContainer = $widget.find('.enix-bf-submit-container');
        var $overCapacityNotice = $('<p class="enix-bf-over-capacity-notice"></p>');
        var $requestSwitchBtn = $(
            '<button type="button" class="enix-bf-request-switch-btn"></button>'
        );

        if ($availableValue.length) {
            $availableValue.text(maxSeats);
        }

        $inputGuests.removeAttr('max');

        $overCapacityNotice.text(
            'You selected more passengers than we can confirm instantly online (' +
                maxSeats +
                ' max). Please use Request Booking and our team will check availability for your group.'
        );
        $requestSwitchBtn.text($form.data('btn-request') || 'REQUEST BOOKING');
        $submitContainer.append($overCapacityNotice);
        $submitContainer.append($requestSwitchBtn);

        function guestsExceedCapacity() {
            var guests = parseInt($inputGuests.val(), 10) || minPax;
            return guests > maxSeats;
        }

        function updateCapacityUI() {
            var over = guestsExceedCapacity();

            if ('booking' === activeTab && over) {
                $btnSubmit.hide();
                $overCapacityNotice.show();
                $requestSwitchBtn.show();
            } else {
                $btnSubmit.show();
                $overCapacityNotice.hide();
                $requestSwitchBtn.hide();

                if ('booking' === activeTab) {
                    $btnSubmit.text($form.data('btn-booking') || 'BOOK NOW');
                } else {
                    $btnSubmit.text($form.data('btn-request') || 'REQUEST BOOKING');
                }
            }
        }

        function getActivePricing() {
            // If departure locations are configured, override base price + extra fee from selected option
            if (hasLocations) {
                var $opt = $inputLocation.find('option:selected');
                if ($opt.length && $opt.val() !== '') {
                    return {
                        base: parseFloat($opt.data('base')) || 0,
                        extra: parseFloat($opt.data('extra')) || 0
                    };
                }
                // No location selected yet — total shows 0
                return {
                    base: 0,
                    extra: 0
                };
            }
            return {
                base: basePrice,
                extra: extraCharge
            };
        }

        function recalcTotal() {
            var guests = parseInt($inputGuests.val(), 10) || minPax;
            if (guests < minPax) {
                guests = minPax;
            }
            var pricing = getActivePricing();
            var extras = Math.max(0, guests - basePaxLimit);
            var total = pricing.base + (extras * pricing.extra);
            $totalValue.text(currency + total.toFixed(2));
        }

        $inputGuests.on('input change keyup', function() {
            recalcTotal();
            updateCapacityUI();
        });
        if (hasLocations) {
            $inputLocation.on('change', function() {
                recalcTotal();
            });
        }
        recalcTotal();


        // Active tab tracker: 'booking' or 'request'
        var activeTab = 'booking';

        // Toggle which fields are visible based on the active tab
        function applyTabFields() {
            if ('request' === activeTab) {
                $widget.find('.enix-bf-request-only').show();
                $widget.find('.enix-bf-booking-only').hide();
            } else {
                $widget.find('.enix-bf-request-only').hide();
                $widget.find('.enix-bf-booking-only').show();
            }
        }

        // Honor a single-mode widget (request-only / booking-only) on load
        if ($widget.find('.enix-bf-tab').length === 1) {
            activeTab = $widget.find('.enix-bf-tab').data('tab');
        }
        applyTabFields();
        updateCapacityUI();

        if (isOneWayTaxi && $inputDropoff.length) {
            $inputDropoff.closest('.enix-bf-col').hide();
        }

        var isTaxi = rentalType === 'taxi';
        var $inputPickupTime = $();
        var $inputDropoffTime = $();

        if (isTaxi) {
            var $dateRow = $inputPickup.closest('.enix-bf-row');
            var $timeRow = $('<div class="enix-bf-row enix-bf-taxi-time-row"></div>');
            var $pickupTimeCol = $('<div class="enix-bf-col"></div>');

            $pickupTimeCol.append('<label class="enix-bf-label">Pick-up Time</label>');
            $inputPickupTime = $('<input type="time" name="pickup_time" class="enix-bf-input" required>');
            $pickupTimeCol.append($inputPickupTime);
            $timeRow.append($pickupTimeCol);

            if (!isOneWayTaxi) {
                var $dropoffTimeCol = $('<div class="enix-bf-col enix-bf-dropoff-time-field"></div>');
                $dropoffTimeCol.append('<label class="enix-bf-label">Drop-off Time</label>');
                $inputDropoffTime = $('<input type="time" name="dropoff_time" class="enix-bf-input" required>');
                $dropoffTimeCol.append($inputDropoffTime);
                $timeRow.append($dropoffTimeCol);
            }

            $dateRow.after($timeRow);
        }

        // Helper: format a JS Date as d-m-Y
        function formatDmY(d) {
            var dd = ('0' + d.getDate()).slice(-2);
            var mm = ('0' + (d.getMonth() + 1)).slice(-2);
            return dd + '-' + mm + '-' + d.getFullYear();
        }

        // Initialize Flatpickr on Date Inputs
        var fpConfig = {
            dateFormat: 'd-m-Y',
            minDate: 'today',
            allowInput: true,
            onChange: function(selectedDates, dateStr, instance) {
                // Enforce Drop-off date to be after Pick-up date
                if (instance.element.name === 'pickup_date' && $inputDropoff.length && !isOneWayTaxi) {
                    var dropoffInstance = $inputDropoff[0]._flatpickr;
                    if (dropoffInstance) {
                        dropoffInstance.set('minDate', dateStr);
                    }
                    // For Tour bookings, auto-fill dropoff = pickup + (durationDays - 1)
                    if ('tour' === rentalType && selectedDates.length && durationDays >= 1) {
                        var pickup = selectedDates[0];
                        var dropoff = new Date(pickup.getTime());
                        dropoff.setDate(dropoff.getDate() + (durationDays - 1));
                        if (dropoffInstance) {
                            dropoffInstance.setDate(dropoff, true);
                        } else {
                            $inputDropoff.val(formatDmY(dropoff));
                        }
                    }
                }
            }
        };

        if (typeof flatpickr !== 'undefined') {
            flatpickr($inputPickup[0], fpConfig);
            if ($inputDropoff.length && !isOneWayTaxi) {
                flatpickr($inputDropoff[0], fpConfig);
            }
        }


        // Tab Navigation Toggles
        $widget.find('.enix-bf-tab').on('click', function(e) {
            e.preventDefault();
            var $this = $(this);

            $widget.find('.enix-bf-tab').removeClass('active');
            $this.addClass('active');

            activeTab = $this.data('tab');
            applyTabFields();
            updateCapacityUI();

            if ('booking' === activeTab) {
                $btnSubmit.text($form.data('btn-booking') || 'BOOK NOW');
            } else {
                $btnSubmit.text($form.data('btn-request') || 'REQUEST BOOKING');
            }

            // Clear status messages when switching contexts
            $messageBox.removeClass('success error').hide().text('');
        });

        $requestSwitchBtn.on('click', function(e) {
            e.preventDefault();
            var $requestTab = $widget.find('.enix-bf-tab[data-tab="request"]');
            if ($requestTab.length) {
                $requestTab.trigger('click');
                $messageBox
                    .removeClass('error')
                    .addClass('success')
                    .text(
                        'Please fill in your contact details below and submit your request.'
                    )
                    .fadeIn();
            }
        });

        // AJAX Form Submission
        $form.on('submit', function(e) {
            e.preventDefault();

            // Clear messages
            $messageBox.removeClass('success error').hide().text('');

            // Basic client-side validation
            var pickupDate = $inputPickup.val();
            var dropoffDate = $inputDropoff.length ? $inputDropoff.val() : pickupDate;
            var guests = parseInt($inputGuests.val(), 10) || 1;

            if (!pickupDate) {
                $messageBox.addClass('error').text('Please select a Pick-up Date.').fadeIn();
                return;
            }

            if (!isOneWayTaxi && $inputDropoff.length && !dropoffDate) {
                $messageBox.addClass('error').text('Please select a Drop-off Date.').fadeIn();
                return;
            }

            if (isTaxi) {
                if (!$inputPickupTime.val()) {
                    $messageBox.addClass('error').text('Please select a Pick-up Time.').fadeIn();
                    return;
                }

                if (!isOneWayTaxi && $inputDropoffTime.length && !$inputDropoffTime.val()) {
                    $messageBox.addClass('error').text('Please select a Drop-off Time.').fadeIn();
                    return;
                }
            }

            // Instant booking is only available within vehicle capacity
            if ('booking' === activeTab && guests > maxSeats) {
                $messageBox
                    .addClass('error')
                    .text(
                        'Online booking is available for up to ' +
                            maxSeats +
                            ' passengers. Please use Request Booking for larger groups.'
                    )
                    .fadeIn();
                return;
            }

            // Departure location required when configured
            if (hasLocations && !$inputLocation.val()) {
                $messageBox.addClass('error').text('Please select a Departure Location.').fadeIn();
                return;
            }



            // Disable buttons during submission to prevent double submission
            $btnSubmit.prop('disabled', true).css('opacity', '0.6');

            var ajaxData;

            if ('request' === activeTab) {
                // Request booking: validate customer fields
                var customerName = $widget.find('input[name="customer_name"]').val();
                var customerEmail = $widget.find('input[name="customer_email"]').val();

                if (!customerName) {
                    $messageBox.addClass('error').text('Please enter your name.').fadeIn();
                    $btnSubmit.prop('disabled', false).css('opacity', '1');
                    return;
                }
                if (!customerEmail) {
                    $messageBox.addClass('error').text('Please enter your email.').fadeIn();
                    $btnSubmit.prop('disabled', false).css('opacity', '1');
                    return;
                }

                ajaxData = {
                    action: 'enix_request_booking',
                    security: enixBookingData.nonce,
                    product_id: productId,
                    pickup_date: pickupDate,
                    dropoff_date: dropoffDate,
                    pickup_time: isTaxi ? $inputPickupTime.val() : '',
                    dropoff_time: isTaxi && !isOneWayTaxi ? ($inputDropoffTime.val() || '') : '',
                    guests: guests,
                    customer_name: customerName,
                    customer_email: customerEmail,
                    customer_phone: $widget.find('input[name="customer_phone"]').val(),
                    customer_address: $widget.find('input[name="customer_address"]').val(),
                    customer_message: $widget.find('textarea[name="customer_message"]').val(),
                    departure_location: hasLocations ? ($inputLocation.val() || '') : ''

                };

                $.ajax({
                    url: enixBookingData.ajax_url,
                    type: 'POST',
                    dataType: 'json',
                    data: ajaxData,
                    success: function(response) {
                        if (response.success) {
                            $messageBox.removeClass('error').addClass('success').text(response.data.message).fadeIn();
                            $form[0].reset();
                            recalcTotal();
                        } else {
                            var errorMsg = response.data && response.data.message ? response.data.message : enixBookingData.i18n.booking_failed;
                            $messageBox.addClass('error').text(errorMsg).fadeIn();
                        }
                        $btnSubmit.prop('disabled', false).css('opacity', '1');
                    },
                    error: function() {
                        $messageBox.addClass('error').text(enixBookingData.i18n.booking_failed).fadeIn();
                        $btnSubmit.prop('disabled', false).css('opacity', '1');
                    }
                });
                return;
            }

            ajaxData = {
                action: 'enix_booking_add_to_cart',
                security: enixBookingData.nonce,
                product_id: productId,
                pickup_date: pickupDate,
                dropoff_date: dropoffDate,
                pickup_time: isTaxi ? $inputPickupTime.val() : '',
                dropoff_time: isTaxi && !isOneWayTaxi ? ($inputDropoffTime.val() || '') : '',
                guests: guests,
                tab_type: activeTab,
                departure_location: hasLocations ? ($inputLocation.val() || '') : ''

            };

            $.ajax({
                url: enixBookingData.ajax_url,
                type: 'POST',
                dataType: 'json',
                data: ajaxData,
                success: function(response) {
                    if (response.success) {
                        $messageBox.addClass('success').text(enixBookingData.i18n.booking_success).fadeIn();

                        // Redirect smoothly to checkout/cart
                        setTimeout(function() {
                            window.location.href = response.data.redirect_url;
                        }, 1000);
                    } else {
                        var errorMsg = response.data && response.data.message ? response.data.message : enixBookingData.i18n.booking_failed;
                        $messageBox.addClass('error').text(errorMsg).fadeIn();
                        $btnSubmit.prop('disabled', false).css('opacity', '1');
                    }
                },
                error: function() {
                    $messageBox.addClass('error').text(enixBookingData.i18n.booking_failed).fadeIn();
                    $btnSubmit.prop('disabled', false).css('opacity', '1');
                }
            });
        });
    });
});