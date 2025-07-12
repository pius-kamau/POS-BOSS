document.addEventListener('DOMContentLoaded', function() {
    // Initialize date and time
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Sample product database
    const products = {
        '4901234567890': { name: 'Apples', price: 2.99 },
        '5901234567891': { name: 'Bananas', price: 1.49 },
        '6901234567892': { name: 'Milk', price: 3.49 },
        '7901234567893': { name: 'Bread', price: 2.29 },
        '8901234567894': { name: 'Eggs', price: 3.99 },
        '9901234567895': { name: 'Cheese', price: 4.59 },
        '1001234567896': { name: 'Chicken', price: 7.99 },
        '1101234567897': { name: 'Rice', price: 5.49 },
        '1201234567898': { name: 'Pasta', price: 1.99 },
        '1301234567899': { name: 'Coffee', price: 8.99 }
    };
    
    // Cart state
    let cart = [];
    let currentQuantity = 1;
    let selectedPaymentMethod = null;
    let quaggaInitialized = false;
    
    // Cashier management
    let currentCashier = "Alex"; // Default cashier
    const cashierSelect = document.getElementById('cashierSelect');
    
    // DOM elements
    const cartItemsEl = document.getElementById('cartItems');
    const subtotalEl = document.getElementById('subtotal');
    const taxEl = document.getElementById('tax');
    const totalEl = document.getElementById('total');
    const barcodeInput = document.getElementById('barcodeInput');
    const searchBtn = document.getElementById('searchBtn');
    const scanner = document.getElementById('scanner');
    const scannerPlaceholder = document.getElementById('scanner-placeholder');
    const startScanBtn = document.getElementById('startScanBtn');
    const stopScanBtn = document.getElementById('stopScanBtn');
    const completeBtn = document.getElementById('completeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const addQuantityBtn = document.getElementById('addQuantityBtn');
    const receiptBtn = document.getElementById('receiptBtn');
    const receiptModal = document.getElementById('receiptModal');
    const closeReceiptBtn = document.getElementById('closeReceiptBtn');
    const receiptContent = document.getElementById('receiptContent');
    const printBtn = document.getElementById('printBtn');
    const paymentDetails = document.getElementById('paymentDetails');
    const processingModal = document.getElementById('processingModal');
    const processingStatus = document.getElementById('processingStatus');
    const cameraPermissionModal = document.getElementById('cameraPermissionModal');
    const retryPermissionBtn = document.getElementById('retryPermissionBtn');
    const barcodeNotification = document.getElementById('barcodeNotification');
    const detectedBarcode = document.getElementById('detectedBarcode');
    
    // Event listeners
    barcodeInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            processBarcode();
        }
    });
    
    searchBtn.addEventListener('click', processBarcode);
    
    // Cashier selection
    cashierSelect.addEventListener('change', function() {
        currentCashier = this.options[this.selectedIndex].text;
    });
    
    // Scanner activation
    scanner.addEventListener('click', function() {
        if (!quaggaInitialized) {
            startScanner();
        }
    });
    
    startScanBtn.addEventListener('click', startScanner);
    stopScanBtn.addEventListener('click', stopScanner);
    retryPermissionBtn.addEventListener('click', startScanner);
    
    // Product buttons
    document.querySelectorAll('.product-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const name = this.dataset.name;
            const price = parseFloat(this.dataset.price);
            
            addToCart(id, name, price, currentQuantity);
            scanner.classList.add('beep');
            
            setTimeout(() => {
                scanner.classList.remove('beep');
            }, 500);
        });
    });
    
    // Number pad
    document.querySelectorAll('.num-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const value = this.textContent;
            if (value === 'C') {
                currentQuantity = 1;
            } else {
                if (currentQuantity === 1) {
                    currentQuantity = parseInt(value);
                } else {
                    currentQuantity = parseInt(`${currentQuantity}${value}`);
                }
            }
            addQuantityBtn.textContent = `Add (${currentQuantity})`;
        });
    });
    
    // Add quantity button
    addQuantityBtn.addEventListener('click', function() {
        if (barcodeInput.value) {
            processBarcode();
        } else {
            alert('Please scan or enter a product first');
        }
    });
    
    // Clear cart
    clearBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear the current order?')) {
            cart = [];
            updateCart();
        }
    });
    
    // Payment method selection
    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const method = this.id.replace('Btn', '');
            selectPaymentMethod(method);
        });
    });
    
    // Complete sale button
    completeBtn.addEventListener('click', function() {
        if (cart.length === 0) {
            alert('Please add items to the cart first');
            return;
        }
        
        if (!selectedPaymentMethod) {
            alert('Please select a payment method');
            return;
        }
        
        processSale();
    });
    
    // Receipt button
    receiptBtn.addEventListener('click', function() {
        if (cart.length === 0) {
            alert('No items in the current order');
            return;
        }
        
        generateReceipt();
        receiptModal.style.display = 'flex';
    });
    
    // Close receipt modal
    closeReceiptBtn.addEventListener('click', function() {
        receiptModal.style.display = 'none';
    });
    
    // Print button
    printBtn.addEventListener('click', function() {
        alert('Receipt sent to printer');
        receiptModal.style.display = 'none';
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === receiptModal) {
            receiptModal.style.display = 'none';
        }
        if (e.target === cameraPermissionModal) {
            cameraPermissionModal.style.display = 'none';
        }
    });
    
    // Functions
    function updateDateTime() {
        const now = new Date();
        document.getElementById('time').textContent = now.toLocaleTimeString();
        document.getElementById('date').textContent = now.toLocaleDateString();
    }
    
    function processBarcode() {
        const barcode = barcodeInput.value.trim();
        if (!barcode) return;
        
        processScannedBarcode(barcode);
        barcodeInput.value = '';
        currentQuantity = 1;
        addQuantityBtn.textContent = 'Add';
    }
    
    function processScannedBarcode(barcode) {
        // Check if barcode exists in our database
        if (products[barcode]) {
            const product = products[barcode];
            addToCart(barcode, product.name, product.price, currentQuantity);
            scanner.classList.add('beep');
            
            setTimeout(() => {
                scanner.classList.remove('beep');
            }, 500);
        } else {
            // Try to find by name (case insensitive)
            const searchTerm = barcode.toLowerCase();
            const foundProduct = Object.entries(products).find(([_, product]) => 
                product.name.toLowerCase().includes(searchTerm)
            );
            
            if (foundProduct) {
                const [id, product] = foundProduct;
                addToCart(id, product.name, product.price, currentQuantity);
                scanner.classList.add('beep');
                
                setTimeout(() => {
                    scanner.classList.remove('beep');
                }, 500);
            } else {
                showNotification(`Product not found: ${barcode}`, 'error');
            }
        }
    }
    
    function startScanner() {
        if (quaggaInitialized) {
            Quagga.start();
            scannerPlaceholder.classList.add('hidden');
            startScanBtn.classList.add('hidden');
            stopScanBtn.classList.remove('hidden');
            return;
        }
        
        scannerPlaceholder.classList.add('hidden');
        
        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: document.querySelector('#scanner-container'),
                constraints: {
                    width: 480,
                    height: 320,
                    facingMode: "environment" // Use the rear camera if available
                },
            },
            decoder: {
                readers: [
                    "code_128_reader",
                    "ean_reader",
                    "ean_8_reader",
                    "code_39_reader",
                    "code_39_vin_reader",
                    "codabar_reader",
                    "upc_reader",
                    "upc_e_reader",
                    "i2of5_reader"
                ],
                debug: {
                    showCanvas: true,
                    showPatches: true,
                    showFoundPatches: true,
                    showSkeleton: true,
                    showLabels: true,
                    showPatchLabels: true,
                    showRemainingPatchLabels: true,
                    boxFromPatches: {
                        showTransformed: true,
                        showTransformedBox: true,
                        showBB: true
                    }
                }
            },
        }, function(err) {
            if (err) {
                console.error(err);
                scannerPlaceholder.classList.remove('hidden');
                cameraPermissionModal.style.display = 'flex';
                return;
            }
            
            quaggaInitialized = true;
            startScanBtn.classList.add('hidden');
            stopScanBtn.classList.remove('hidden');
            
            Quagga.start();
            
            // Make sure the video is properly sized
            setTimeout(() => {
                const video = document.querySelector('#scanner-container video');
                if (video) {
                    video.style.width = '100%';
                    video.style.height = '100%';
                    video.style.objectFit = 'cover';
                }
            }, 500);
        });
        
        Quagga.onDetected(function(result) {
            const code = result.codeResult.code;
            
            // Show notification
            detectedBarcode.textContent = code;
            barcodeNotification.classList.add('show');
            
            // Process the barcode
            processScannedBarcode(code);
            
            // Hide notification after 3 seconds
            setTimeout(() => {
                barcodeNotification.classList.remove('show');
            }, 3000);
        });
    }
    
    function stopScanner() {
        if (quaggaInitialized) {
            Quagga.stop();
            scannerPlaceholder.classList.remove('hidden');
            startScanBtn.classList.remove('hidden');
            stopScanBtn.classList.add('hidden');
        }
    }
    
    function addToCart(id, name, price, quantity) {
        // Check if product already in cart
        const existingItem = cart.find(item => item.id === id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                id,
                name,
                price,
                quantity
            });
        }
        
        updateCart();
        showNotification(`Added: ${name} x${quantity}`);
    }
    
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type === 'success' ? '' : 'error'}`;
        notification.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${type === 'success' ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' : 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'}" />
            </svg>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    function updateCart() {
        cartItemsEl.innerHTML = '';
        
        if (cart.length === 0) {
            cartItemsEl.innerHTML = `
                <div class="cart-empty">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p>No items in cart</p>
                </div>
            `;
            subtotalEl.textContent = '$0.00';
            taxEl.textContent = '$0.00';
            totalEl.textContent = '$0.00';
            completeBtn.disabled = true;
            completeBtn.classList.add('btn-disabled');
            return;
        }
        
        let subtotal = 0;
        
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            itemEl.innerHTML = `
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)} × ${item.quantity}</div>
                </div>
                <div class="cart-item-total">
                    <div class="cart-item-total-price">$${itemTotal.toFixed(2)}</div>
                    <button class="cart-item-remove" data-index="${index}">Remove</button>
                </div>
            `;
            cartItemsEl.appendChild(itemEl);
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                cart.splice(index, 1);
                updateCart();
            });
        });
        
        const tax = subtotal * 0.08;
        const total = subtotal + tax;
        
        subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        taxEl.textContent = `$${tax.toFixed(2)}`;
        totalEl.textContent = `$${total.toFixed(2)}`;
        
        completeBtn.disabled = false;
        completeBtn.classList.remove('btn-disabled');
    }
    
    function selectPaymentMethod(method) {
        selectedPaymentMethod = method;
        
        // Reset all buttons
        document.querySelectorAll('.payment-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Highlight selected button
        document.getElementById(`${method}Btn`).classList.add('selected');
        
        // Show payment details based on method
        switch(method) {
            case 'cash':
                paymentDetails.innerHTML = `
                    <div class="payment-row">
                        <span>Total Due:</span>
                        <span class="payment-value">${totalEl.textContent}</span>
                    </div>
                    <div class="form-control">
                        <input type="number" id="cashAmount" placeholder="Cash amount" class="input">
                        <div class="input-group-append">
                            <button id="calculateChangeBtn" class="btn btn-primary">Calculate</button>
                        </div>
                    </div>
                    <div id="changeAmount" class="hidden">
                        <div class="payment-row">
                            <span>Change:</span>
                            <span id="changeValue" class="payment-value">$0.00</span>
                        </div>
                    </div>
                `;
                
                document.getElementById('calculateChangeBtn').addEventListener('click', function() {
                    const cashAmount = parseFloat(document.getElementById('cashAmount').value);
                    const totalDue = parseFloat(totalEl.textContent.replace('$', ''));
                    
                    if (isNaN(cashAmount)) {
                        alert('Please enter a valid amount');
                        return;
                    }
                    
                    if (cashAmount < totalDue) {
                        alert('Cash amount is less than total due');
                        return;
                    }
                    
                    const change = cashAmount - totalDue;
                    document.getElementById('changeValue').textContent = `$${change.toFixed(2)}`;
                    document.getElementById('changeAmount').classList.remove('hidden');
                });
                break;
                
            case 'card':
                paymentDetails.innerHTML = `
                    <div class="payment-row">
                        <span>Total to charge:</span>
                        <span class="payment-value">${totalEl.textContent}</span>
                    </div>
                    <div class="payment-info" style="background-color: #dbeafe; color: #1e40af;">
                        <p>Ready to process card payment</p>
                        <p>Please insert, tap, or swipe card when ready</p>
                    </div>
                `;
                break;
                
            case 'mobile':
                paymentDetails.innerHTML = `
                    <div class="payment-row">
                        <span>Total to pay:</span>
                        <span class="payment-value">${totalEl.textContent}</span>
                    </div>
                    <div class="payment-info" style="background-color: #f3e8ff; color: #6b21a8;">
                        <p>Mobile payment ready</p>
                        <div style="margin: 0.75rem auto; width: 6rem; height: 6rem;">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <rect x="7" y="7" width="3" height="3"></rect>
                                <rect x="14" y="7" width="3" height="3"></rect>
                                <rect x="7" y="14" width="3" height="3"></rect>
                                <rect x="14" y="14" width="3" height="3"></rect>
                            </svg>
                        </div>
                        <p>Scan QR code with mobile payment app</p>
                    </div>
                `;
                break;
                
            case 'giftCard':
                paymentDetails.innerHTML = `
                    <div class="payment-row">
                        <span>Total due:</span>
                        <span class="payment-value">${totalEl.textContent}</span>
                    </div>
                    <div class="form-control">
                        <input type="text" id="giftCardNumber" placeholder="Gift card number" class="input">
                    </div>
                    <div class="payment-info" style="background-color: #fce7f3; color: #9d174d;">
                        <p>Enter gift card number or swipe card</p>
                    </div>
                `;
                break;
        }
        
        paymentDetails.style.display = 'block';
    }
    
    function processSale() {
        processingModal.style.display = 'flex';
        
        // Simulate payment processing
        let step = 0;
        const steps = [
            'Connecting to payment gateway...',
            'Verifying transaction...',
            'Processing payment...',
            'Finalizing transaction...',
            'Payment approved!'
        ];
        
        const interval = setInterval(() => {
            if (step < steps.length) {
                processingStatus.textContent = steps[step];
                step++;
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    processingModal.style.display = 'none';
                    completeSale();
                }, 1000);
            }
        }, 800);
    }
    
    function completeSale() {
        generateReceipt();
        receiptModal.style.display = 'flex';
        
        // Reset everything
        cart = [];
        updateCart();
        selectedPaymentMethod = null;
        paymentDetails.style.display = 'none';
        document.querySelectorAll('.payment-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        showNotification('Sale completed successfully!');
    }
    
    function generateReceipt() {
        const now = new Date();
        const dateStr = now.toLocaleDateString();
        const timeStr = now.toLocaleTimeString();
        
        let subtotal = 0;
        cart.forEach(item => {
            subtotal += item.price * item.quantity;
        });
        
        const tax = subtotal * 0.08;
        const total = subtotal + tax;
        
        let receiptHTML = `
            <div class="receipt-header">
                <div class="receipt-store-name">SuperMarket</div>
                <div class="receipt-store-info">123 Main Street</div>
                <div class="receipt-store-info">Anytown, ST 12345</div>
                <div class="receipt-store-info">Tel: (555) 123-4567</div>
            </div>
            
            <div class="receipt-meta">
                <span>Date: ${dateStr}</span>
                <span>Time: ${timeStr}</span>
            </div>
            
            <div class="receipt-meta">
                <span>Order #: 1234</span>
                <span>Cashier: ${currentCashier}</span>
            </div>
            
            <div class="receipt-items">
                <div class="receipt-item-header">
                    <div>Item</div>
                    <div class="receipt-item-price">Price</div>
                    <div class="receipt-item-qty">Qty</div>
                    <div class="receipt-item-total">Total</div>
                </div>
        `;
        
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            receiptHTML += `
                <div class="receipt-item">
                    <div>${item.name}</div>
                    <div class="receipt-item-price">$${item.price.toFixed(2)}</div>
                    <div class="receipt-item-qty">${item.quantity}</div>
                    <div class="receipt-item-total">$${itemTotal.toFixed(2)}</div>
                </div>
            `;
        });
        
        receiptHTML += `
            </div>
            
            <div class="receipt-summary">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>$${subtotal.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span>Tax (8%):</span>
                    <span>$${tax.toFixed(2)}</span>
                </div>
                <div class="summary-total">
                    <span>Total:</span>
                    <span>$${total.toFixed(2)}</span>
                </div>
            </div>
            
            <div class="receipt-footer">
                <div class="receipt-thank-you">Thank you for shopping with us!</div>
                <div class="receipt-note">Please keep your receipt for returns</div>
            </div>
        `;
        
        receiptContent.innerHTML = receiptHTML;
    }
    
    // Initialize the cart display
    updateCart();
    
    // Clean up Quagga when page is unloaded
    window.addEventListener('beforeunload', function() {
        if (quaggaInitialized) {
            Quagga.stop();
        }
    });
});