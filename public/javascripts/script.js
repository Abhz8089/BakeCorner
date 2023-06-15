function addToCart(proId){
    $.ajax({
        url:'/add-to-cart/'+proId,
        method:'get',
        success:(response)=>{
            if(response.status){
                Swal.fire({
                    position: 'center',
                    icon: 'success',
                    title: 'Product is Added to Cart',
                    showConfirmButton: false,
                    timer: 1000,
                   
                  })
                let count=$('#cart-count').html()
                count=parseInt(count)+1
                $("#cart-count").html(count)
                
            }
            
        }
    })
   
}