import "./index.scss";

const btnDomain = document.querySelector("#submit-domain");
const domain = document.querySelector(".ens-domain");
const components = document.querySelector(".components");

btnDomain.addEventListener('click', () => {
    const domainName = document.querySelector("#domain-name");
    domain.style.display = "none";
    components.style.display = "flex";
    document.querySelector("#exchange-address").value = domainName.value;
})