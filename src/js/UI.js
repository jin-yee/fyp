let buttons = document.querySelectorAll('.card')
let rightPanels = document.querySelectorAll('.user-input')

let lbnavbar = document.querySelector('.lb-navbar')
let lbinput = document.querySelector('.lb-input')

let lbcontainers = Array.from(lbinput.children)
let navbarchildren = Array.from(lbnavbar.children)

var coll = Array.from(document.getElementsByClassName("collapsible"))

function removeActiveClasses() {
    rightPanels.forEach(rightPanel => {
        rightPanel.classList.remove('active')
    })
}

export default function UI() {

    coll.forEach(col => {
        col.addEventListener('click', () => {
            col.classList.toggle("active")
            var content = col.nextElementSibling
            if (content.style.display === "grid") {
                content.style.display = "none"
            } else {
                content.class
                content.style.display = "grid"
                content.style.width = "100%"
            }
        })
    })

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            removeActiveClasses()
            switch (button.id) {
                case 'epfd-calculation':
                    var panel = document.getElementById("user-input-epfd");
                    panel.classList.add('active');
                    break;
                case 'lb-calculation':
                    var panel = document.getElementById("user-input-lb");
                    panel.classList.add('active');
                    break;
                default:
                    break;
            }
        })
    })

    navbarchildren.forEach((navbtn, index) => {
        // console.log(navbtn)
        navbtn.addEventListener('click', () => {
            navbarchildren.forEach(navbtn => {
                navbtn.classList.remove('active')
            })

            lbcontainers.forEach(container => {
                container.classList.remove('active')
            })

            lbcontainers[index].classList.add('active')
            navbtn.classList.add('active')

        })
    })
}
