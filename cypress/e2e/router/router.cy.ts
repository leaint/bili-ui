/// <reference types="cypress" />

// Welcome to Cypress!
//
// This spec file contains a variety of sample tests
// for a todo list app that are designed to demonstrate
// the power of writing tests in Cypress.
//
// To learn more about how Cypress works and
// what makes it such an awesome testing tool,
// please read our getting started guide:
// https://on.cypress.io/introduction-to-cypress

describe("路由测试", () => {
  beforeEach(() => {
    localStorage.setItem("apiprefix", "http://127.22:8080/proxy/");
    localStorage.setItem(
      "cookie",
      "buvid2=BB62AC62-5247-444F-BC19-F4C106458010148821infoc;buvid3=BB62AC62-5247-444F-BC19-F4C106458010148821infoc;"
    );

    cy.visit("http://local.bilibili.com:5173/");
  });

  it("普通搜索页面可以搜到20个结果", () => {
    cy.get('[href="/search"]').click();

    cy.get("#app .box fieldset").should("have.length", 2);

    cy.get(".text").type("2008");

    cy.get(".searchbar > button").contains("Search").click();
    cy.get(".resultbox li").should("have.length", 20);
  });

  it("从普通搜索页面可以跳转到用户搜索页面", () => {
    cy.get('[href="/search"]').click();
    cy.get(".text").type("2008");

    cy.get(".searchbar > button").contains("Search").click();

    cy.get("select.search").select("2");
    cy.get("#ub").should("exist");
    cy.get(".upuserbox li").should("exist");
  });

  it("某普通搜索页面，某用户搜索页面，主页，普通搜索页", () => {
    cy.get('[href="/search"]').click();
    cy.get(".text").type("2008");
    cy.get(".searchbar > button").contains("Search").click();

    cy.get("select.search").select("2");
    cy.get(".text").type("gitlab");
    cy.get(".searchbar > button").contains("Search").click();

    cy.get('[href="/"]').click();

    cy.get('[href="/search"]').click();
    cy.get(".resultbox li").should("have.length", 0);

    cy.go(-1);
    cy.location("pathname").should("equal", "/");
    cy.go(-1);
    cy.location("pathname").should("equal", "/upuser");
    cy.get(".upuserbox li").should("have.length", 0);
  });

  it("普通搜索页面跳转到主页，再返回，页面有缓存结果", () => {
    cy.get('[href="/search"]').click();
    cy.get(".text").type("2008");
    cy.get(".searchbar > button").contains("Search").click();

    cy.get('[href="/"]').click();
    cy.go(-1);
    cy.location("pathname").should("equal", "/search");
    cy.get(".resultbox li").should("have.length", 20);
  });

  it("某普通搜索页，同关键词用户搜索页，后退，有缓存数据", () => {
    cy.get('[href="/search"]').click();
    cy.get(".text").type("2008");
    cy.get(".searchbar > button").contains("Search").click();

    cy.get(".resultbox li").should("have.length", 20);

    cy.get("select.search").select("2");

    cy.get(".upuserbox li").should("exist");

    cy.go(-1);

    cy.get(".resultbox li").should("have.length", 20);
  });

  it("某普通搜索页，同关键词用户搜索页，后退，有页面模式下拉框选择正确", () => {
    cy.get('[href="/search"]').click();
    cy.get(".text").type("2008");

    cy.get("select.search").should("have.value", "0");
    cy.get(".searchbar > button").contains("Search").click();

    cy.get("select.search").select("2");

    cy.get("select.search").should("have.value", "2");

    cy.go(-1);

    cy.get("select.search").should("have.value", "0");
  });
});
