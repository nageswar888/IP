package com.example.lenovo.ipaas_1;

import org.json.JSONObject;

/**
 * Created by Arun on 11/17/2016.
 */


public class AdviceObject {
    String name;
    int amount;
    JSONObject jsonObject;
    String adviceID;

    /*public String getAdviceID()
    {
        return adviceID;
    }

    public void setAdviceID(String adviceID)
    {
        this.adviceID = adviceID;
    }*/

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
    public int getAmount() {
        return amount;
    }

    public void setAmount(int amount) {
        this.amount = amount;
    }
    public JSONObject getJSONObject() {
        return jsonObject;
    }

    public void setJSONObject(JSONObject jsonObject) {
        this.jsonObject = jsonObject;
    }

    @Override
    public String toString() {
        return "AdviceObject{" +
                "name='" + name + '\'' +
                ", amount=" + amount +
                ", jsonObject=" + jsonObject +
                '}';
    }
}
