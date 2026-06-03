document.querySelectorAll("a").forEach(link => {

link.addEventListener("click", function(e){

if(this.href){

e.preventDefault()

document.body.style.opacity="0"

setTimeout(()=>{

window.location=this.href

},400)

}

})

})
