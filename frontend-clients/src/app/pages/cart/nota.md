# Cuando ya este el carrito necesito que esto de abajo este para que la pagina de pago funcione :D

 async pay(clientSecret: string, orderId: number) {
   await this.paymentService.checkout(clientSecret, orderId);
}